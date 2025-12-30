import { Router } from 'express';
import { PixSubscriptionController } from '../controllers/PixSubscriptionController';
import { PixAdminController } from '../controllers/PixAdminController';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import multer from 'multer';

const router = Router();

// Configure multer for memory storage (will upload to cloud)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
});

// User routes
router.post('/payments/pix/select-plan', AuthMiddleware, PixSubscriptionController.selectPlan);
router.post('/payments/:id/upload-proof', upload.single('proof'), PixSubscriptionController.uploadProof);
router.get('/payments/me', AuthMiddleware, PixSubscriptionController.getSubscription);
router.get('/payments/:id', AuthMiddleware, PixSubscriptionController.getSubscription);
router.put('/payments/:id/cancel', AuthMiddleware, PixSubscriptionController.cancelSubscription);

// Admin routes
router.get('/admin/payments', AuthMiddleware, PixAdminController.listSubscriptions);
router.put('/admin/payments/:id/approve', AuthMiddleware, PixAdminController.approveSubscription);
router.put('/admin/payments/:id/reject', AuthMiddleware, PixAdminController.rejectSubscription);

export default router;
