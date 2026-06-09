import { supabase } from './supabaseClient';
import type { PlanningDocument, DesignDocument } from '../types/database';

const BUCKET_NAME = 'project-documents';

/**
 * Storage service for project documents
 * Handles file uploads, downloads, and deletions using Supabase Storage
 */
export const storageService = {
  /**
   * Upload a file to Supabase Storage
   * @param file File object to upload
   * @param projectId Project ID
   * @param type Document type ('planning' | 'design')
   * @returns {Promise<{ url: string | null; error: Error | null }>}
   */
  uploadFile: async (
    file: File,
    projectId: string,
    type: 'planning' | 'design'
  ): Promise<{ url: string | null; error: Error | null }> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['pdf', 'pptx', 'ppt', 'doc', 'docx'];

    if (!allowedTypes.includes(fileExt || '')) {
      return {
        url: null,
        error: new Error(`不支持的文件类型。仅支持 PDF、PPTX 和 PPT 格式`)
      };
    }

    // Check file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return {
        url: null,
        error: new Error(`文件过大。最大支持 100MB`)
      };
    }

    const filePath = `${projectId}/${type}-${Date.now()}.${fileExt}`;
    const fullPath = `${BUCKET_NAME}/${filePath}`;

    // Upload file to Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return { url: null, error };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  },

  /**
   * Create a document record in the database
   */
  createDocumentRecord: async (
    projectId: string,
    fileName: string,
    fileUrl: string,
    fileSize: number | null,
    mimeType: string | null,
    type: 'planning' | 'design'
  ): Promise<{ data: PlanningDocument | DesignDocument | null; error: Error | null }> => {
    const commonData = {
      project_id: projectId,
      file_name: fileName,
      file_url: fileUrl,
      file_size: fileSize,
      mime_type: mimeType,
    };

    if (type === 'planning') {
      // Cast to any to bypass strict type checking for now
      const { data, error } = await supabase
        .from('planning_documents')
        .insert(commonData as any)
        .select()
        .single() as { data: PlanningDocument | null; error: any };

      return { data, error };
    } else {
      const { data, error } = await supabase
        .from('design_documents')
        .insert(commonData as any)
        .select()
        .single() as { data: DesignDocument | null; error: any };

      return { data, error };
    }
  },

  /**
   * Delete a file from Storage and database record
   */
  deleteFile: async (documentId: string, type: 'planning' | 'design'): Promise<{ error: Error | null }> => {
    // Get document info
    const tableName = type === 'planning' ? 'planning_documents' : 'design_documents';

    const { data: document, error: fetchError } = await supabase
      .from(tableName)
      .select('file_url')
      .eq('id', documentId)
      .single() as any;

    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      return { error: fetchError };
    }

    // Delete from Storage
    const fileUrl = typeof document === 'object' && document ? (document as any).file_url : null;
    if (fileUrl) {
      const path = String(fileUrl).replace(`storage/v1/object/${BUCKET_NAME}/`, '');

      // Extract just the key part after bucket name
      const storagePath = path.replace(`${BUCKET_NAME}/`, '');

      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue to delete DB record even if storage deletion fails
      }
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', documentId);

    return { error: dbError };
  },

  /**
   * Get documents for a project
   */
  getDocuments: async (
    projectId: string,
    type: 'planning' | 'design'
  ): Promise<{ data: PlanningDocument[] | DesignDocument[]; error: Error | null }> => {
    const tableName = type === 'planning' ? 'planning_documents' : 'design_documents';

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * Get file download URL (signed)
   */
  getDownloadUrl: async (filePath: string): Promise<{ url: string | null; error: Error | null }> => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return { url: null, error };
    }

    return { url: data.signedUrl, error: null };
  },

  /**
   * Check if a file type is allowed
   */
  isAllowedFileType: (fileName: string): boolean => {
    const allowedExtensions = ['.pdf', '.pptx', '.ppt', '.doc', '.docx'];
    const lowerName = fileName.toLowerCase();
    return allowedExtensions.some(ext => lowerName.endsWith(ext));
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number | null): string => {
    if (!bytes || bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};
