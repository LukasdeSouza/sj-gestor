import { Router } from 'express';
import { PixSubscriptionController } from '../controllers/PixSubscriptionController';
import { PixAdminController } from '../controllers/PixAdminController';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/proofs'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

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
