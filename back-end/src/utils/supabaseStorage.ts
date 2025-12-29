import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

/**
 * Upload proof file to Supabase Storage
 */
export async function uploadProofToStorage(
  file: Express.Multer.File,
  subscriptionId: string
): Promise<string> {
  try {
    const bucket = 'comprovantes';
    const fileName = `${subscriptionId}/${Date.now()}-${file.originalname}`;

    logger.debug('Uploading proof to Supabase Storage', { subscriptionId, fileName });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      logger.error('Supabase upload error', error.message, { subscriptionId, fileName });
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    logger.info('Proof uploaded successfully', { subscriptionId, fileName, publicUrl });

    return publicUrl;
  } catch (error) {
    logger.error('Error uploading proof', error, { subscriptionId });
    throw error;
  }
}

/**
 * Delete proof file from Supabase Storage
 */
export async function deleteProofFromStorage(proofUrl: string): Promise<void> {
  try {
    const bucket = 'comprovantes';
    // Extract file path from URL
    const urlParts = proofUrl.split('/');
    const fileName = urlParts.slice(-2).join('/');

    logger.debug('Deleting proof from Supabase Storage', { fileName });

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      logger.error('Supabase delete error', error.message, { fileName });
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }

    logger.info('Proof deleted successfully', { fileName });
  } catch (error) {
    logger.error('Error deleting proof', error, { proofUrl });
    throw error;
  }
}
