import makeWASocket, { WASocket, fetchLatestWaWebVersion, DisconnectReason, AuthenticationState, SignalAuthState } from "baileys";
import whatsappRepository from "../repositories/whatsappRepository";
import MessageHandler from "./handlerMessage";
import { getMessage } from "./message";
import { WAMessage } from "baileys";
import { Boom } from "@hapi/boom";
import { logger } from "./logger";
import QRCode from "qrcode";
import { eventsEmitter } from "./events";
import { proto } from "baileys";

export const sessions: Record<string, WASocket> = {};

// In-memory auth state storage
const authStates: Record<string, AuthenticationState> = {};

// Create in-memory auth state
const useMemoryAuthState = (sessionId: string): { state: AuthenticationState; saveCreds: () => Promise<void> } => {
  if (!authStates[sessionId]) {
    authStates[sessionId] = {
      creds: {
        noiseKey: undefined,
        signedIdentityKey: undefined,
        signedPreKey: undefined,
        registrationId: undefined,
        advSecretKey: undefined,
        nextPreKeyId: undefined,
        firstUnuploadedPreKeyId: undefined,
        accountSettings: undefined,
        me: undefined,
        signalIdentities: [],
        myAppStateKeyId: undefined,
        lastAccountSyncTimestamp: undefined,
        platform: "android",
      },
      keys: {
        get: (type: string, jids: string[]) => {
          const keys: Record<string, any> = {};
          for (const jid of jids) {
            const key = `${type}.${jid}`;
            keys[jid] = authStates[sessionId].keys[key];
          }
          return keys;
        },
        set: (data: any) => {
          for (const [key, value] of Object.entries(data)) {
            authStates[sessionId].keys[key] = value;
          }
        },
      },
    } as any;
  }

  return {
    state: authStates[sessionId],
    saveCreds: async () => {
      // Optionally save to database here
      logger.debug('Credentials updated for session', { sessionId });
    },
  };
};

export const createWhatsAppSession = async (
  sessionId: string,
  onQr: (qr: string) => void,
  onReady: () => void
): Promise<WASocket> => {

  const { state, saveCreds } = useMemoryAuthState(sessionId);
  const { version } = await fetchLatestWaWebVersion({});

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: {
      level: "silent" as any,
    } as any,
  });

  let resolved = false;

  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect, qr } = update;

    // 📌 QR gerado
    if (qr) {
      onQr(qr);
      const qrImage = await QRCode.toDataURL(qr);
      eventsEmitter.emit(sessionId, {
        status: "qr",
        qr: qrImage,
        is_connected: false,
      });
    }

    // 📌 Conectado
    if (connection === "open" && !resolved) {
      resolved = true;

      await whatsappRepository.markAsConnected(sessionId);

      eventsEmitter.emit(sessionId, {
        is_connected: true,
        sessionId
      });

      onReady();
    }

    // 📌 Desconectado
    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        await whatsappRepository.markAsDisconnected(sessionId);

        eventsEmitter.emit(sessionId, {
          is_connected: false
        });

        delete authStates[sessionId];
        delete sessions[String(sessionId)];
        return;
      }

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

      const formattedMessage: any = getMessage(message);
      if (formattedMessage !== undefined) {
        MessageHandler(sock, formattedMessage);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
  sessions[String(sessionId)] = sock;
  return sock;
};
