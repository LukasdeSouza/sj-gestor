import { Request, Response } from 'express';
import { PixSubscriptionService } from '../services/PixSubscriptionService';
import { SelectPlanSchema, validateProofFile } from '../schemas/PixSubscriptionSchema';
import { PlanId } from '@prisma/client';
import { logger } from '../utils/logger';
import { uploadProofToStorage } from '../utils/supabaseStorage';
import {
  PixSubscriptionError,
  InvalidFileError,
  UnauthorizedError,
  NotFoundError,
  InvalidStateError,
} from '../errors/PixSubscriptionError';

export class PixSubscriptionController {
  /**
   * Select plan and create payment record
   */
  static async selectPlan(req: Request, res: Response) {
    try {
      const userId = (req as any).decodedToken?.id as string | undefined;
      if (!userId) {
        logger.warn('Unauthorized selectPlan attempt');
        return res.status(401).json({ error: true, message: 'Não autenticado' });
      }

      // Validate input
      const validation = SelectPlanSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('Invalid selectPlan input', { userId, errors: validation.error.issues });
        return res.status(400).json({ error: true, message: validation.error.issues[0]?.message || 'Dados inválidos' });
      }

      const { planId } = validation.data;

      // Select plan
      const result = await PixSubscriptionService.selectPlan(userId, planId as PlanId);

      return res.json({ error: false, data: result });
    } catch (err: any) {
      if (err instanceof PixSubscriptionError) {
        return res.status(err.statusCode).json({ error: true, message: err.message });
      }
      logger.error('selectPlan error', err);
      return res.status(500).json({ error: true, message: 'Erro ao selecionar plano' });
    }
  }

  /**
   * Upload payment proof
   */
  static async uploadProof(req: Request, res: Response) {
    try {
      const { id: subscriptionId } = req.params;
      const file = req.file;

      // Validate file
      try {
        validateProofFile(file);
      } catch (err: any) {
        logger.warn('Invalid file upload', { subscriptionId, error: err.message });
        return res.status(400).json({ error: true, message: err.message });
      }

      // Upload proof to Supabase Storage
      const proofUrl = await uploadProofToStorage(file!, subscriptionId);

      // Update proof in database
      await PixSubscriptionService.uploadProof(subscriptionId, '', proofUrl);

      return res.json({ error: false, message: 'Comprovante enviado com sucesso', data: { proofUrl } });
    } catch (err: any) {
      if (
        err instanceof PixSubscriptionError ||
        err instanceof UnauthorizedError ||
        err instanceof NotFoundError ||
        err instanceof InvalidStateError
      ) {
        return res.status(err.statusCode).json({ error: true, message: err.message });
      }
      logger.error('uploadProof error', err);
      return res.status(500).json({ error: true, message: 'Erro ao enviar comprovante' });
    }
  }

  /**
   * Get user's subscription
   */
  static async getSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).decodedToken?.id as string | undefined;
      if (!userId) {
        logger.warn('Unauthorized getSubscription attempt');
        return res.status(401).json({ error: true, message: 'Não autenticado' });
      }

      const subscription = await PixSubscriptionService.getSubscription(userId);

      if (!subscription) {
        return res.status(404).json({ error: true, message: 'Pagamento não encontrado' });
      }

      return res.json({ error: false, data: subscription });
    } catch (err: any) {
      if (err instanceof PixSubscriptionError) {
        return res.status(err.statusCode).json({ error: true, message: err.message });
      }
      logger.error('getSubscription error', err);
      return res.status(500).json({ error: true, message: 'Erro ao buscar pagamento' });
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).decodedToken?.id as string | undefined;
      if (!userId) {
        logger.warn('Unauthorized cancelSubscription attempt');
        return res.status(401).json({ error: true, message: 'Não autenticado' });
      }

      const { id: subscriptionId } = req.params;

      await PixSubscriptionService.cancelSubscription(subscriptionId, userId);

      return res.json({ error: false, message: 'Pagamento cancelado com sucesso' });
    } catch (err: any) {
      if (
        err instanceof PixSubscriptionError ||
        err instanceof UnauthorizedError ||
        err instanceof NotFoundError ||
        err instanceof InvalidStateError
      ) {
        return res.status(err.statusCode).json({ error: true, message: err.message });
      }
      logger.error('cancelSubscription error', err);
      return res.status(500).json({ error: true, message: 'Erro ao cancelar pagamento' });
    }
  }
}
