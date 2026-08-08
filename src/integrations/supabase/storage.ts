// Supabase Storage configuration
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/integrations/firebase/config';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not found in environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name – read from environment (fallback to 'resumes')
export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'resumes';
if (!import.meta.env.VITE_SUPABASE_STORAGE_BUCKET) {
  console.warn('VITE_SUPABASE_STORAGE_BUCKET not set in .env; using default "resumes"');
}

// Helper to sanitize storage paths (replace spaces and parentheses with underscores)
export const sanitizePath = (p: string) => {
  // Replace spaces and parentheses with underscores
  let cleaned = p.replace(/[\s()]+/g, "_");
  // Collapse multiple consecutive dots into a single dot
  cleaned = cleaned.replace(/\.\.+/g, ".");
  // Remove leading/trailing underscores or dots
  cleaned = cleaned.replace(/^[_\.]+|[_\.]+$/g, "");
  return cleaned;
};

// Helper to sanitize storage paths (replace spaces and parentheses with underscores)


/**
 * Get Supabase client with Firebase Auth token
 * This allows Supabase to verify the user via Firebase JWT
 */
async function getAuthenticatedSupabaseClient() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get Firebase ID token
  const token = await user.getIdToken();

  // Create Supabase client with custom headers containing Firebase token
  // Note: You may need to configure Supabase to accept Firebase JWT tokens
  // For now, we'll use the anon key with RLS policies
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

// Storage utility functions
export const storageService = {
  /**
   * Upload a file to Supabase Storage
   * @param file - File to upload
   * @param path - Storage path (e.g., 'userId/filename.pdf')
   * @returns Promise with public URL
   */


  async uploadFile(file: File, path: string): Promise<string> {
    // Use authenticated client if available, otherwise use default
    let client = supabase;
    try {
      client = await getAuthenticatedSupabaseClient();
    } catch (error) {
      console.warn('Could not get authenticated client, using default:', error);
    }

    const safePath = sanitizePath(path);
    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(safePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(safePath);
    return urlData.publicUrl;
  },

  /**
   * Get public URL for a file
   * @param path - Storage path
   * @returns Public URL
   */
  getPublicUrl(path: string): string {
    const safePath = sanitizePath(path);
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(safePath);
    return data.publicUrl;
  },

  /**
   * Create a signed URL for a file (valid for 1 hour)
   * @param path - Storage path
   * @returns Promise with signed URL
   */
  async createSignedUrl(path: string): Promise<string> {
    const safePath = sanitizePath(path);

    // Helper to try creating signed URL with a specific client
    const tryCreateSignedUrl = async (client: any) => {
      const { data, error } = await client.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(safePath, 3600);

      if (error) throw error;
      return data.signedUrl;
    };

    try {
      // 1. Try with authenticated client
      const authClient = await getAuthenticatedSupabaseClient();
      return await tryCreateSignedUrl(authClient);
    } catch (authError) {
      console.warn('Authenticated signed URL creation failed, trying anon:', authError);

      // 2. Fallback to anonymous client
      try {
        return await tryCreateSignedUrl(supabase);
      } catch (anonError: any) {
        throw new Error(`Create signed URL failed (anon): ${anonError.message}`);
      }
    }
  },

  /**
   * Delete a file from storage
   * @param path - Storage path
   */
  async deleteFile(path: string): Promise<void> {
    // Use authenticated client if available
    let client = supabase;
    try {
      client = await getAuthenticatedSupabaseClient();
    } catch (error) {
      console.warn('Could not get authenticated client for delete, using default:', error);
    }

    const safePath = sanitizePath(path);
    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .remove([safePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  },

  /**
   * Download a file from storage
   * @param path - Storage path
   * @returns File blob
   */
  async downloadFile(path: string): Promise<Blob> {
    console.log('Supabase download attempt:', { bucket: STORAGE_BUCKET, path });
    const safePath = sanitizePath(path);

    // Helper to try downloading with a specific client
    const tryDownload = async (client: any) => {
      const { data, error } = await client.storage
        .from(STORAGE_BUCKET)
        .download(safePath);

      if (error) throw error;
      return data;
    };

    try {
      // 1. Try with authenticated client
      const authClient = await getAuthenticatedSupabaseClient();
      return await tryDownload(authClient);
    } catch (authError) {
      console.warn('Authenticated download failed, trying anon:', authError);

      // 2. Fallback to anonymous client
      try {
        return await tryDownload(supabase);
      } catch (anonError: any) {
        console.error('Supabase download error (anon):', {
          message: anonError.message,
          details: anonError,
          path: path,
          safePath: safePath,
          bucket: STORAGE_BUCKET
        });
        throw new Error(`Download failed: ${anonError.message || JSON.stringify(anonError)}`);
      }
    }
  },
};

export default storageService;

