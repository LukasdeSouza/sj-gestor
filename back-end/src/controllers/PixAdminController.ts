import { Request, Response } from 'express';
import { PixAdminService } from '../services/PixAdminService';
import { PaymentStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  PixSubscriptionError,
  NotFoundError,
  InvalidStateError,
} from '../errors/PixSubscriptionError';

export class PixAdminController {
  /**
   * List all payments
   */
  static async listSubscriptions(req: Request, res: Response) {
    try {
      const userId = (req as any).decodedToken?.id as string | undefined;
      if (!userId) {
        logger.warn('Unauthorized listSubscriptions attempt');
        return res.status(401).json({ error: true, message: 'Não autenticado' });
      }

      // TODO: Verify admin role
      const { status, userId: filterUserId } = req.query;

      const filters: any = {};
      if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
        filters.status = status;
      }
      if (filterUserId) {
        filters.userId = filterUserId;
      }

      const payments = await PixAdminService.listSubscriptions(filters);

      return res.json({ error: false, data: payments });
    } catch (err: any) {
      if (err instanceof PixSubscriptionError) {
        return res.status(err.statusCode).json({ error: true, message: err.message });
      }
      logger.error('listSubscriptions error', err);
      return res.status(500).json({ error: true, message: 'Erro ao listar pagamentos' });
    }
  }

  /**
   * Approve payment
   */
  static async approveSubscription(req: Request, res: Response) {
    try {
      const adminId = (req as any).decodedToken?.id as string | undefined;
      if (!adminId) {
        logger.warn('Unauthorized approveSubscription attempt');
        return res.status(401).json({ error: true, message: 'Não autenticado' });
      }

      // TODO: Verify admin role

      const { id: subscriptionId } = req.params;

      await PixAdminService.approveSubscription(subscriptionId, adminId);

      return res.json({ error: false, message: 'Pagamento aprovado com sucesso' });
    } catch (err: any) {
      if (
        err instanceof PixSubscriptionError ||
        err instanceof NotFoundError ||
        err instanceof InvalidStateError
      ) {
        return res.status(err.statusCode).json({ error: true, message: err.message });
      }
      logger.error('approveSubscription error', err);
      return res.status(500).json({ error: true, message: 'Erro ao aprovar pagamento' });
    }
  }

  /**
   * Reject payment
   */
  static async rejectSubscription(req: Request, res: Response) {
    try {
      const adminId = (req as any).decodedToken?.id as string | undefined;
      if (!adminId) {
        logger.warn('Unauthorized rejectSubscription attempt');
        return res.status(401).json({ error: true, message: 'Não autenticado' });
      }

      // TODO: Verify admin role

      const { id: subscriptionId } = req.params;

      await PixAdminService.rejectSubscription(subscriptionId, adminId);

      return res.json({ error: false, message: 'Pagamento rejeitado com sucesso' });
    } catch (err: any) {
      if (
        err instanceof PixSubscriptionError ||
        err instanceof NotFoundError ||
        err instanceof InvalidStateError
      ) {
        return res.status(err.statusCode).json({ error: true, message: err.message });
      }
      logger.error('rejectSubscription error', err);
      return res.status(500).json({ error: true, message: 'Erro ao rejeitar pagamento' });
    }
  }
}
