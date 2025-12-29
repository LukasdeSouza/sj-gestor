import whatsappRepository from "../repositories/whatsappRepository";
import { createWhatsAppSession, sessions } from "../utils/baileys";
import { CreateConnectionDTO } from "../interfaces/whatsapp";
import { APIError } from "../utils/wrapException";
import QRCode from "qrcode";
import fs from "fs";
import { eventsEmitter } from "../utils/events";

export default class whatsappService {
  static async connectWhatsApp({ userId, phone_number }: CreateConnectionDTO) {
    const { data, error } = await whatsappRepository.createConnection(
      userId,
      phone_number
    );

    if (error || !data) {
      throw new APIError("Erro ao criar conexão.");
    }

    return new Promise((resolve) => {
      let resolved = false;

      createWhatsAppSession(
        data.id,

        async (qr) => {
          if (!resolved) {
            const qrImage = await QRCode.toDataURL(qr);
            resolve({
              status: "qr",
              qr: qrImage,
              connection: data
            });
            resolved = true;
          }
        },

        async () => {
          if (!resolved) {
            await whatsappRepository.markAsConnected(data.id);
            resolve({
              status: "connected",
              connection: data
            });
            resolved = true;
          }
        }
      );
    });
  };

  static async findConnection(id: string) {
    return await whatsappRepository.findConnection(id);
  }

  static async findConnectWhatsApp(id: string) {
    const dbSession = await whatsappRepository.findConnectWhatsApp(id);

    // Se a sessão não existe na memória, mas está como conectada no DB,
    // significa que a conexão caiu. Devemos corrigir o estado.
    if (dbSession && dbSession.is_connected && !sessions[id]) {
      await whatsappRepository.markAsDisconnected(id);
      if (fs.existsSync(`./auth/${id}`)) {
        fs.rmSync(`./auth/${id}`, { recursive: true, force: true });
      }
      // Emite o evento para avisar o frontend que a conexão caiu.
      eventsEmitter.emit(id, { ...dbSession });

      dbSession.is_connected = false; // Atualiza o objeto para retorno imediato
    }

    if (dbSession) {
      dbSession.is_connected = !!sessions[id] && dbSession.is_connected;
    }

    return dbSession;
  }

  static async disconnect(id: string) {

    await whatsappRepository.markAsDisconnected(id);

    // Fecha a sessão real
    if (sessions[id]) {
      sessions[id].ws.close();
      delete sessions[id];
    }

    // Emite evento para o SSE atualizar o front
    eventsEmitter.emit(id, { is_connected: false });

    return { message: "Desconectado com sucesso" };
  }
};