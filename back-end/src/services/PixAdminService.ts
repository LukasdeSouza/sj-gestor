import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { PaymentStatus } from '@prisma/client';
import { findPlanById } from '../config/plans';
import { logger } from '../utils/logger';
import {
  PixSubscriptionError,
  NotFoundError,
  InvalidStateError,
} from '../errors/PixSubscriptionError';

export class PixAdminService {
  /**
   * List all subscriptions with optional filters
   */
  static async listSubscriptions(filters?: { status?: PaymentStatus; userId?: string }) {
    try {
      logger.debug('Listing subscriptions', { filters });

      const subscriptions = await SubscriptionRepository.listPixSubscriptions(filters);

      logger.info('Subscriptions listed successfully', { count: subscriptions.length });

      return subscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.user_id,
        userName: sub.user.name,
        userEmail: sub.user.email,
        planId: sub.plan_id,
        amount: findPlanById(sub.plan_id)?.price || 0,
        status: sub.payment_status,
        proofUrl: sub.proof_url,
        proofUploadedAt: sub.proof_uploaded_at,
        approvedAt: sub.approved_at,
        approvedByAdminId: sub.approved_by_admin_id,
        approvedByAdminName: sub.approved_by_admin?.name,
        rejectedAt: sub.rejected_at,
        createdAt: sub.createdAt,
      }));
    } catch (error) {
      logger.error('Error listing subscriptions', error, { filters });
      throw new PixSubscriptionError('Erro ao listar pagamentos', 500);
    }
  }

  /**
   * Approve subscription
   */
  static async approveSubscription(subscriptionId: string, adminId: string) {
    try {
      logger.debug('Approving subscription', { subscriptionId, adminId });

      // Get subscription
      const subscription = await SubscriptionRepository.findPixById(subscriptionId);
      if (!subscription) {
        logger.warn('Subscription not found for approval', { subscriptionId, adminId });
        throw new NotFoundError('Pagamento não encontrado', 404, { subscriptionId });
      }

      // Verify status
      if (subscription.payment_status === PaymentStatus.APPROVED) {
        logger.warn('Approval of already approved payment', { subscriptionId, adminId });
        throw new InvalidStateError('Pagamento já foi aprovado', 409, { subscriptionId });
      }

      if (subscription.payment_status !== PaymentStatus.PROOF_UPLOADED) {
        logger.warn('Approval of payment without proof', { subscriptionId, adminId, status: subscription.payment_status });
        throw new InvalidStateError(
          'Pagamento deve estar com comprovante enviado para ser aprovado',
          409,
          { subscriptionId }
        );
      }

      // Approve payment
      await SubscriptionRepository.updatePixApproval(subscriptionId, adminId, new Date());

      logger.info('Subscription approved successfully', { subscriptionId, adminId });
    } catch (error) {
      if (
        error instanceof PixSubscriptionError ||
        error instanceof NotFoundError ||
        error instanceof InvalidStateError
      ) {
        throw error;
      }
      logger.error('Error approving subscription', error, { subscriptionId, adminId });
      throw new PixSubscriptionError('Erro ao aprovar pagamento', 500, { subscriptionId });
    }
  }

  /**
   * Reject subscription
   */
  static async rejectSubscription(subscriptionId: string, adminId: string) {
    try {
      logger.debug('Rejecting subscription', { subscriptionId, adminId });

      // Get subscription
      const subscription = await SubscriptionRepository.findPixById(subscriptionId);
      if (!subscription) {
        logger.warn('Subscription not found for rejection', { subscriptionId, adminId });
        throw new NotFoundError('Pagamento não encontrado', 404, { subscriptionId });
      }

      // Verify status
      if (subscription.payment_status === PaymentStatus.REJECTED) {
        logger.warn('Rejection of already rejected payment', { subscriptionId, adminId });
        throw new InvalidStateError('Pagamento já foi rejeitado', 409, { subscriptionId });
      }

      if (subscription.payment_status === PaymentStatus.APPROVED) {
        logger.warn('Rejection of approved payment', { subscriptionId, adminId });
        throw new InvalidStateError(
          'Não é possível rejeitar um pagamento já aprovado',
          409,
          { subscriptionId }
        );
      }

      // Reject payment
      await SubscriptionRepository.updatePixRejection(subscriptionId);

      logger.info('Subscription rejected successfully', { subscriptionId, adminId });
    } catch (error) {
      if (
        error instanceof PixSubscriptionError ||
        error instanceof NotFoundError ||
        error instanceof InvalidStateError
      ) {
        throw error;
      }
      logger.error('Error rejecting subscription', error, { subscriptionId, adminId });
      throw new PixSubscriptionError('Erro ao rejeitar pagamento', 500, { subscriptionId });
    }
  }
}
