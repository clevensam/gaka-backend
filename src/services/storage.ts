import { supabaseAdmin } from './supabase.js';

export interface UploadResult {
  url: string;
  path: string;
}

export const uploadFile = async (
  file: Buffer,
  fileName: string,
  bucket: string = 'blog-images',
  userId?: string
): Promise<UploadResult> => {
  const fileExt = fileName.split('.').pop();
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = userId ? `${userId}/${uniqueName}` : uniqueName;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: getContentType(fileExt || ''),
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
};

export const deleteFile = async (
  filePath: string,
  bucket: string = 'blog-images'
): Promise<void> => {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

const getContentType = (ext: string): string => {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
};