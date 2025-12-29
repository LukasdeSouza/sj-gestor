
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default class whatsappRepository {
  static async createConnection(userId: string, phone_number: string) {

    const existing = await prisma.whatsAppConnection.findFirst({
      where: {
        user_id: userId
      }
    })

    if (existing) {
      return { data: existing, error: null };
    }

    const data = await prisma.whatsAppConnection.create({
      data: {
        user: { connect: { id: userId } },
        phone_number: phone_number,
        is_connected: false,
        last_connected_at: null
      }
    })

    return { data };
  };

  static async markAsConnected(id: string) {
    return await prisma.whatsAppConnection.update({
      where: {
        id: id
      },
      data: {
        is_connected: true,
        last_connected_at: new Date().toISOString()
      }
    })
  };

  static async markAsDisconnected(id: string) {
    return await prisma.whatsAppConnection.update({
      where: {
        id: id
      },
      data: {
        is_connected: false,
        last_connected_at: null
      }
    })
  }

  static async findConnectWhatsApp(id: string) {
    return await prisma.whatsAppConnection.findUnique({
      where: {
        id: id
      },
    })
  }

  static async findConnection(id: string) {
    return await prisma.whatsAppConnection.findUnique({
      where: {
        user_id: id
      },
    })
  }
};

