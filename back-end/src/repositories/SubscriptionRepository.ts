import { PrismaClient, SubscriptionStatus, PlanId, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class SubscriptionRepository {
  static async upsertByUser(userId: string, data: {
    planId: PlanId,
    status?: SubscriptionStatus,
    mpPreferenceId?: string | null,
    mpPaymentId?: string | null,
    activatedAt?: Date | null,
  }) {
    return prisma.subscription.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        plan_id: data.planId,
        status: data.status || SubscriptionStatus.PENDING,
        mp_preference_id: data.mpPreferenceId || null,
        mp_payment_id: data.mpPaymentId || null,
        activatedAt: data.activatedAt || null,
      },
      update: {
        plan_id: data.planId,
        status: data.status || undefined,
        mp_preference_id: data.mpPreferenceId || undefined,
        mp_payment_id: data.mpPaymentId || undefined,
        activatedAt: data.activatedAt || undefined,
      }
    });
  }

  static async activateByPreference(
    preferenceId: string,
    data: {
      mpPaymentId: string;
      activatedAt: Date;
      status: SubscriptionStatus;
    }
  ) {
    return prisma.subscription.updateMany({
      where: { mp_preference_id: preferenceId },
      data: {
        mp_payment_id: data.mpPaymentId,
        activatedAt: data.activatedAt,
        status: data.status,
      },
    });
  }

  static async getByUser(userId: string) {
    return prisma.subscription.findUnique({ where: { user_id: userId } });
  }

  static async setPlanForUser(userId: string, planId: PlanId) {
    return prisma.subscription.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        plan_id: planId,
        status: planId === PlanId.FREE ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
      },
      update: {
        plan_id: planId,
        status: planId === PlanId.FREE ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
      },
    });
  }

  static async adminActivate(userId: string, data: { activatedAt?: Date | null; paymentId?: string | null }) {
    const current = await prisma.subscription.findUnique({ where: { user_id: userId } });
    return prisma.subscription.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        plan_id: current?.plan_id ?? PlanId.FREE,
        status: SubscriptionStatus.ACTIVE,
        activatedAt: data.activatedAt ?? new Date(),
        mp_payment_id: data.paymentId ?? current?.mp_payment_id ?? null,
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        activatedAt: data.activatedAt ?? new Date(),
        mp_payment_id: data.paymentId ?? undefined,
      },
    });
  }

  static async setStatusByReference(refId: string, status: SubscriptionStatus) {
    return prisma.subscription.updateMany({
      where: { mp_preference_id: refId },
      data: { status },
    });
  }

  // PIX Payment Methods (NEW)
  static async createPixPayment(userId: string, planId: PlanId, pixQrCode: string) {
    return prisma.subscription.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        plan_id: planId,
        status: SubscriptionStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        pix_qr_code: pixQrCode,
      },
      update: {
        plan_id: planId,
        payment_status: PaymentStatus.PENDING,
        pix_qr_code: pixQrCode,
      },
    });
  }

  static async findPixById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: { user: true, approved_by_admin: true },
    });
  }

  static async findPixByUserId(userId: string) {
    return prisma.subscription.findUnique({
      where: { user_id: userId },
      include: { user: true, approved_by_admin: true },
    });
  }

  static async updatePixProof(id: string, proofUrl: string) {
    return prisma.subscription.update({
      where: { id },
      data: {
        proof_url: proofUrl,
        proof_uploaded_at: new Date(),
        payment_status: PaymentStatus.PROOF_UPLOADED,
      },
    });
  }

  static async updatePixStatus(id: string, paymentStatus: PaymentStatus) {
    return prisma.subscription.update({
      where: { id },
      data: { payment_status: paymentStatus },
    });
  }

  static async updatePixApproval(id: string, adminId: string, approvedAt: Date) {
    return prisma.subscription.update({
      where: { id },
      data: {
        payment_status: PaymentStatus.APPROVED,
        approved_at: approvedAt,
        approved_by_admin_id: adminId,
        status: SubscriptionStatus.ACTIVE,
        activatedAt: approvedAt,
      },
    });
  }

  static async updatePixRejection(id: string) {
    return prisma.subscription.update({
      where: { id },
      data: {
        payment_status: PaymentStatus.REJECTED,
        rejected_at: new Date(),
      },
    });
  }

  static async listPixSubscriptions(filters?: { status?: PaymentStatus; userId?: string }) {
    return prisma.subscription.findMany({
      where: {
        payment_status: filters?.status,
        user_id: filters?.userId,
      },
      include: { user: true, approved_by_admin: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async cancelPixPayment(id: string) {
    return prisma.subscription.update({
      where: { id },
      data: {
        payment_status: PaymentStatus.CANCELED,
        canceled_at: new Date(),
        status: SubscriptionStatus.CANCELED,
      },
    });
  }
}

export type StripeRefsUpdate = {
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_payment_intent_id?: string | null;
};

export namespace SubscriptionRepository {
  export async function updateStripeRefsByUser(userId: string, refs: StripeRefsUpdate) {
    return prisma.subscription.update({
      where: { user_id: userId },
      data: refs,
    });
  }
}
