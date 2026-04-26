import logger from './loggerService.js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/config.js';

let configured = false;

const ensureCloudinaryConfigured = (): boolean => {
  if (configured) return true;

  const { cloudName, apiKey, apiSecret } = config.images.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) return false;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  configured = true;
  return true;
};

export const isCloudinaryConfigured = (): boolean => ensureCloudinaryConfigured();

/**
 * Construye el public_id de Cloudinary desde un nombre de archivo.
 * Remueve la extensión, sanitiza caracteres no permitidos y limita a 50 chars.
 * Esta función es la fuente canónica — imageService e UploadController la importan.
 */
export const buildCloudinaryPublicId = (filename: string): string =>
  filename
    .replace(/\.[^/.]+$/, '')          // quitar extensión
    .replace(/[^a-zA-Z0-9_-]/g, '_')  // sanitizar (espacios → _)
    .substring(0, 100);                 // limitar longitud (100 para soportar nombres con timestamp legacy)

export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  folder: string,
  publicId: string,
  originalName?: string,
): Promise<{ secureUrl: string; publicId: string }> => {
  if (!ensureCloudinaryConfigured()) {
    throw new Error('Cloudinary no configurado: faltan CLOUDINARY_*');
  }

  // publicId ya viene sanitizado (llamador usa buildCloudinaryPublicId)
  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        use_filename: false,
        unique_filename: false,
        overwrite: true
      },
      (error, uploadResult) => {
        if (error) return reject(error);
        resolve(uploadResult);
      },
    );
    uploadStream.end(buffer);
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id
  };
};

export const deleteCloudinaryByPublicId = async (publicId: string): Promise<boolean> => {
  if (!publicId || !ensureCloudinaryConfigured()) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok' || result.result === 'not found';
  } catch (error) {
    logger.error('Error al eliminar imagen en Cloudinary', {
      publicId,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
    return false;
  }
};

export const extractCloudinaryPublicId = (url: string): string | null => {
  if (!url || !url.includes('/upload/')) return null;

  try {
    const cleanUrl = url.split('?')[0];
    const marker = '/upload/';
    const idx = cleanUrl.indexOf(marker);
    if (idx === -1) return null;

    let tail = cleanUrl.slice(idx + marker.length);
    tail = tail.replace(/^v\d+\//, '');
    const dotIdx = tail.lastIndexOf('.');
    if (dotIdx === -1) return tail;
    return tail.slice(0, dotIdx);
  } catch {
    return null;
  }
};
