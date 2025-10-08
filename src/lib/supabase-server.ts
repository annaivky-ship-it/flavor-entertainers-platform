/**
 * Server-side Supabase utilities
 * File upload helpers and admin operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin client with service role key for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Upload file to Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param file - File buffer or blob
 * @param contentType - MIME type
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType?: string
): Promise<{ url: string; path: string } | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
}

/**
 * Generate signed URL for private files (expires in 1 hour)
 */
export async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL exception:', error);
    return null;
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * Upload receipt image
 */
export async function uploadReceipt(
  bookingRef: string,
  file: Buffer | Blob,
  contentType: string
): Promise<string | null> {
  const timestamp = Date.now();
  const path = `receipts/${bookingRef}-${timestamp}.jpg`;

  const result = await uploadFile('receipts', path, file, contentType);
  return result?.url || null;
}

/**
 * Upload vetting document
 */
export async function uploadVettingDocument(
  performerId: string,
  docType: string,
  file: Buffer | Blob,
  contentType: string
): Promise<string | null> {
  const timestamp = Date.now();
  const path = `vetting/${performerId}/${docType}-${timestamp}`;

  const result = await uploadFile('vetting-documents', path, file, contentType);
  return result?.url || null;
}

/**
 * Upload performer profile image
 */
export async function uploadPerformerImage(
  performerId: string,
  file: Buffer | Blob,
  contentType: string,
  isProfile: boolean = false
): Promise<string | null> {
  const timestamp = Date.now();
  const prefix = isProfile ? 'profile' : 'gallery';
  const path = `performers/${performerId}/${prefix}-${timestamp}`;

  const result = await uploadFile('performer-media', path, file, contentType);
  return result?.url || null;
}

/**
 * List files in a bucket path
 */
export async function listFiles(bucket: string, path: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).list(path);

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data.map(file => file.name);
  } catch (error) {
    console.error('List files exception:', error);
    return [];
  }
}

export default supabaseAdmin;
