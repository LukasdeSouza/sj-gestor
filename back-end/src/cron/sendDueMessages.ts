import { normalizePhone } from "../utils/mask";
import { PrismaClient } from "@prisma/client";
import { sessions } from "../utils/baileys";
import { endOfDay, isSameDay, startOfDay, subDays } from "date-fns";

const prisma = new PrismaClient();

// Frequências removidas — agora usamos due_at como data literal.

export async function startSendDueMessagesCron() {
  console.log("📌 Rodando CRON de mensagens automáticas...");

  const today = startOfDay(new Date());
  const LOOKBACK_DAYS = 3; // janela fixa de 3 dias para recuperar atrasados
  const start = startOfDay(subDays(today, LOOKBACK_DAYS));
  const end = endOfDay(today);

  const clients = await prisma.client.findMany({
    where: {
      due_at: { gte: start, lte: end },
      user: {
        whatsapp_connection: {
          is_connected: true,
        },
      },
    },
    include: {
      user: { include: { whatsapp_connection: true } },
      product: true,
      template: true,
      key: true,
    },
  });

  for (const client of clients) {
    try {
      const sessionId = client.user.whatsapp_connection?.id;
      const sock = sessionId ? sessions[String(sessionId)] : undefined;

      if (!sock) {
        console.log(`❌ Sessão não encontrada ou desconectada para user ${client.user_id}`);
        continue;
      }

      const jid = "55" + normalizePhone(client.phone) + "@s.whatsapp.net";
      try {
        const exists = await sock.onWhatsApp(jid).catch(() => undefined);
        if (!exists?.[0]?.exists) {
          console.log(`⚠️ Número não possui WhatsApp: ${client.phone}`);
          continue;
        }
      } catch {}

      const dueAt = client.due_at ? new Date(client.due_at) : null;
      if (client.last_reminder_due_at && dueAt && isSameDay(new Date(client.last_reminder_due_at), dueAt)) {
        // Já lembrado neste vencimento específico
        continue;
      }
      const dueDate = dueAt ? dueAt.toLocaleDateString('pt-BR') : "Sem vencimento";

      const valorFormatado = client.product?.value != null
        ? Number(client.product.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "-";

      const baseTemplate = client.template?.content || (
        "Olá, {nome}!\n\nLembrando do pagamento do produto {produto} no valor de {valor} com vencimento em {vencimento}."
      );

      // Substitui placeholders do template como era antes
      const templateMessage = baseTemplate
        .replace("{nome}", client.name)
        .replace("{produto}", client.product?.name || "-")
        .replace("{valor}", valorFormatado)
        .replace("{vencimento}", dueDate);

      const pixBlock = client.key
        ? `\n💰 Dados do Pagamento (PIX)\n\n📦 Produto: ${client.product?.name || "-"}\n💲 Valor: ${valorFormatado}\n📅 Vencimento: ${dueDate}\n\n🔑 Chave PIX: ${client.key.key_type}, ${client.key.key_value}`
        : "";

      const finalMessage = `${templateMessage}${pixBlock ? `\n\n${pixBlock}` : ""}`;

      await sock.sendMessage(jid, { text: finalMessage });

      // Marca que já enviamos o lembrete para este due_at
      await prisma.client.update({
        where: { id: client.id },
        data: { last_reminder_due_at: client.due_at ?? null },
      });

      console.log(`✅ Mensagem enviada para ${client.name}`);

      // Sem marcação de recorrência; mensagem enviada baseada em due_at.
    } catch (err) {
      console.log("Erro ao enviar mensagem para cliente:", err);
    }
  }
}
