import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads/proofs';
fs.ensureDirSync(uploadDir);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG ou PDF'));
  }
};

// Max file size (5MB)
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10);

// Create multer instance
export const uploadProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxFileSize },
});

// Validate proof file
export const validateProofFile = (file: Express.Multer.File | undefined): boolean => {
  if (!file) {
    throw new Error('Arquivo não fornecido');
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(file.mimetype)) {
    throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou PDF');
  }

  if (file.size > maxFileSize) {
    throw new Error(`Arquivo muito grande. Máximo ${maxFileSize / 1024 / 1024}MB`);
  }

  return true;
};

// Get proof file URL
export const getProofFileUrl = (filename: string): string => {
  return `/uploads/proofs/${filename}`;
};

// Delete proof file
export const deleteProofFile = async (filename: string): Promise<void> => {
  try {
    const filePath = path.join(uploadDir, filename);
    await fs.remove(filePath);
  } catch (err) {
    console.error('[FileUpload] Error deleting file:', err);
  }
};
