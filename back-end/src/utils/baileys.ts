import makeWASocket, { useMultiFileAuthState, WASocket, fetchLatestWaWebVersion, DisconnectReason } from "baileys";
import whatsappRepository from "../repositories/whatsappRepository";
import MessageHandler from "./handlerMessage";
import { getMessage } from "./message";
import { WAMessage } from "baileys";
import { Boom } from "@hapi/boom";
import { logger } from "./logger";
import QRCode from "qrcode";
import fs from "fs";
import { eventsEmitter } from "./events";

export const sessions: Record<string, WASocket> = {};

export const createWhatsAppSession = async (
  sessionId: string,
  onQr: (qr: string) => void,
  onReady: () => void
): Promise<WASocket> => {

  const { state, saveCreds } = await useMultiFileAuthState(`./auth/${sessionId}`);
  const { version } = await fetchLatestWaWebVersion({});

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    // Adicione esta configuração de logger
    logger: logger.child({ class: "baileys" }, {
      // Defina o nível de log desejado. 'silent' desativa todos os logs.
      level: "silent", 
    }),
  });

  let resolved = false;

  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    // logger.info(`Socket Update: ${connection || ""}`);

    // 📌 QR gerado
    if (qr) {
      onQr(qr);
      const qrImage = await QRCode.toDataURL(qr);
      eventsEmitter.emit(sessionId, {
        status: "qr", // Exemplo de status
        qr: qrImage, // Envie a imagem base64
        is_connected: false, // Confirma que ainda não está conectado
      });
    }

    // 📌 Conectado
    if (connection === "open" && !resolved) {
      resolved = true; // marca primeiro para evitar duplicidade

      await whatsappRepository.markAsConnected(sessionId);

      // emite evento para SSE atualizar front
      eventsEmitter.emit(sessionId, {
        is_connected: true,
        sessionId
      });

      onReady(); // agora o front sabe que está conectado

      // logger.info("Bot Conectado");
    }

    // 📌 Desconectado
    if (connection === "close") {

      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      // logger.error("Conexão fechada. Código:", statusCode);

      // ❌ Logout real no WhatsApp (usuário desconectou do celular)
      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        await whatsappRepository.markAsDisconnected(sessionId);

        eventsEmitter.emit(sessionId, {
          is_connected: false
        });

        fs.rmSync(`./auth/${sessionId}`, { recursive: true, force: true });

        delete sessions[String(sessionId)];
        return; // Não tenta reconectar
      }

      // 🔄 Qualquer outro motivo → reconectar com retry
      // logger.warn("Tentando reconectar em 5s...");
      setTimeout(() => {
        createWhatsAppSession(sessionId, onQr, onReady);
      }, 5000);
    }
  });

  sock.ev.on("messages.upsert", ({ messages }: { messages: WAMessage[] }) => {
    for (let index = 0; index < messages.length; index++) {
      const message = messages[index];

      const isGroup = message.key.remoteJid?.endsWith("@g.us");
      const isStatus = message.key.remoteJid === "status@broadcast";

      if (isGroup || isStatus) return;

      // @ts-ignore
      const formattedMessage: FormattedMessage | undefined =
        getMessage(message);
      if (formattedMessage !== undefined) {
        MessageHandler(sock, formattedMessage);
      }
    }
  });


  sock.ev.on("creds.update", saveCreds);
  sessions[String(sessionId)] = sock;
  return sock;
};
