import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { PlanId, PaymentStatus } from '@prisma/client';
import { findPlanById } from '../config/plans';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';
import {
  PixSubscriptionError,
  UnauthorizedError,
  NotFoundError,
  InvalidStateError,
} from '../errors/PixSubscriptionError';

export class PixSubscriptionService {
  /**
   * Select a plan and create a payment record
   */
  static async selectPlan(userId: string, planId: PlanId) {
    try {
      logger.debug('Selecting plan', { userId, planId });

      // Validate plan exists
      const plan = findPlanById(planId);
      if (!plan) {
        logger.warn('Invalid plan selected', { userId, planId });
        throw new PixSubscriptionError('Plano inválido', 400, { planId });
      }

      // Get PIX QR Code URL from environment
      const pixQrCodeUrl = process.env.PIX_QR_CODE;
      if (!pixQrCodeUrl) {
        logger.error('PIX QR Code not configured', 'Missing PIX_QR_CODE env var');
        throw new PixSubscriptionError('QR Code PIX não configurado', 500);
      }

      // Generate QR code image from URL
      const pixQrCode = await QRCode.toDataURL(pixQrCodeUrl);

      // Create or update payment record
      const subscription = await SubscriptionRepository.createPixPayment(userId, planId, pixQrCodeUrl);

      logger.info('Plan selected successfully', {
        userId,
        planId,
        subscriptionId: subscription.id,
      });

      return {
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        amount: plan.price,
        pixQrCode: pixQrCode,
        pixKey: process.env.PIX_KEY || '',
        accountHolder: process.env.PIX_ACCOUNT_HOLDER || '',
      };
    } catch (error) {
      if (error instanceof PixSubscriptionError) {
        throw error;
      }
      logger.error('Error selecting plan', error, { userId, planId });
      throw new PixSubscriptionError('Erro ao selecionar plano', 500, { userId, planId });
    }
  }

  /**
   * Upload payment proof
   */
  static async uploadProof(subscriptionId: string, userId: string, proofUrl: string) {
    try {
      logger.debug('Uploading proof', { subscriptionId, userId });

      // Get subscription
      const subscription = await SubscriptionRepository.findPixById(subscriptionId);
      if (!subscription) {
        logger.warn('Subscription not found', { subscriptionId, userId });
        throw new NotFoundError('Pagamento não encontrado', 404, { subscriptionId });
      }

      // Verify ownership
      if (subscription.user_id !== userId) {
        logger.warn('Unauthorized proof upload attempt', { subscriptionId, userId, ownerId: subscription.user_id });
        throw new UnauthorizedError('Acesso negado', 403, { subscriptionId });
      }

      // Verify status
      if (subscription.payment_status === PaymentStatus.APPROVED) {
        logger.warn('Proof upload on approved payment', { subscriptionId, userId });
        throw new InvalidStateError('Pagamento já foi aprovado', 409, { subscriptionId });
      }

      // Update proof
      await SubscriptionRepository.updatePixProof(subscriptionId, proofUrl);

      logger.info('Proof uploaded successfully', { subscriptionId, userId });
    } catch (error) {
      if (
        error instanceof PixSubscriptionError ||
        error instanceof UnauthorizedError ||
        error instanceof NotFoundError ||
        error instanceof InvalidStateError
      ) {
        throw error;
      }
      logger.error('Error uploading proof', error, { subscriptionId, userId });
      throw new PixSubscriptionError('Erro ao enviar comprovante', 500, { subscriptionId, userId });
    }
  }

  /**
   * Get user's subscription
   */
  static async getSubscription(userId: string) {
    try {
      logger.debug('Getting subscription', { userId });

      const subscription = await SubscriptionRepository.findPixByUserId(userId);
      if (!subscription) {
        logger.debug('No subscription found for user', { userId });
        return null;
      }

      return {
        id: subscription.id,
        status: subscription.payment_status,
        planId: subscription.plan_id,
        amount: findPlanById(subscription.plan_id)?.price || 0,
        proofUrl: subscription.proof_url,
        proofUploadedAt: subscription.proof_uploaded_at,
        approvedAt: subscription.approved_at,
        approvedByAdminId: subscription.approved_by_admin_id,
        rejectedAt: subscription.rejected_at,
        activatedAt: subscription.activatedAt,
        canceledAt: subscription.canceled_at,
      };
    } catch (error) {
      logger.error('Error getting subscription', error, { userId });
      throw new PixSubscriptionError('Erro ao buscar pagamento', 500, { userId });
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, userId: string) {
    try {
      logger.debug('Canceling subscription', { subscriptionId, userId });

      // Get subscription
      const subscription = await SubscriptionRepository.findPixById(subscriptionId);
      if (!subscription) {
        logger.warn('Subscription not found for cancellation', { subscriptionId, userId });
        throw new NotFoundError('Pagamento não encontrado', 404, { subscriptionId });
      }

      // Verify ownership
      if (subscription.user_id !== userId) {
        logger.warn('Unauthorized cancellation attempt', { subscriptionId, userId, ownerId: subscription.user_id });
        throw new UnauthorizedError('Acesso negado', 403, { subscriptionId });
      }

      // Verify status
      if (subscription.payment_status === PaymentStatus.CANCELED) {
        logger.warn('Cancellation of already canceled payment', { subscriptionId, userId });
        throw new InvalidStateError('Pagamento já foi cancelado', 409, { subscriptionId });
      }

      // Cancel payment
      await SubscriptionRepository.cancelPixPayment(subscriptionId);

      logger.info('Subscription canceled successfully', { subscriptionId, userId });
    } catch (error) {
      if (
        error instanceof PixSubscriptionError ||
        error instanceof UnauthorizedError ||
        error instanceof NotFoundError ||
        error instanceof InvalidStateError
      ) {
        throw error;
      }
      logger.error('Error canceling subscription', error, { subscriptionId, userId });
      throw new PixSubscriptionError('Erro ao cancelar pagamento', 500, { subscriptionId, userId });
    }
  }
}
