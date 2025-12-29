import { z } from 'zod';
import { PlanId } from '@prisma/client';

// Select Plan Schema
export const SelectPlanSchema = z.object({
  planId: z.enum(['FREE', 'PRO_100', 'PRO_UNLIMITED'] as const).refine(
    (val) => val,
    { message: 'Plano inválido' }
  ),
});

export type SelectPlanDTO = z.infer<typeof SelectPlanSchema>;

// Upload Proof Schema
export const UploadProofSchema = z.object({
  subscriptionId: z.string().uuid('ID de assinatura inválido'),
});

export type UploadProofDTO = z.infer<typeof UploadProofSchema>;

// Approve Subscription Schema
export const ApproveSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid('ID de assinatura inválido'),
});

export type ApproveSubscriptionDTO = z.infer<typeof ApproveSubscriptionSchema>;

// Reject Subscription Schema
export const RejectSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid('ID de assinatura inválido'),
});

export type RejectSubscriptionDTO = z.infer<typeof RejectSubscriptionSchema>;

// Cancel Subscription Schema
export const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid('ID de assinatura inválido'),
});

export type CancelSubscriptionDTO = z.infer<typeof CancelSubscriptionSchema>;

// File validation helper
export const validateProofFile = (file: Express.Multer.File | undefined) => {
  if (!file) {
    throw new Error('Arquivo não fornecido');
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(file.mimetype)) {
    throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou PDF');
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Máximo 5MB');
  }

  return true;
};
