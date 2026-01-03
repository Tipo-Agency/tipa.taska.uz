// Firebase Storage service for file uploads
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { storage } from "../firebase/config";

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload a file to Firebase Storage
 * @param file - File to upload
 * @param path - Storage path (e.g., 'tasks/attachments/', 'documents/')
 * @param fileName - Optional custom file name. If not provided, uses file.name
 * @returns Promise with download URL and storage path
 */
export const uploadFile = async (
  file: File,
  path: string = "uploads/",
  fileName?: string
): Promise<UploadResult> => {
  try {
    // Generate unique file name if not provided
    const name = fileName || `${Date.now()}_${file.name}`;
    const storagePath = `${path}${name}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const url = await getDownloadURL(snapshot.ref);

    return {
      url,
      path: storagePath
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Upload multiple files
 * @param files - Array of files to upload
 * @param path - Storage path
 * @returns Promise with array of upload results
 */
export const uploadFiles = async (
  files: File[],
  path: string = "uploads/"
): Promise<UploadResult[]> => {
  try {
    const uploadPromises = files.map(file => uploadFile(file, path));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param path - Storage path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get download URL for a file
 * @param path - Storage path of the file
 * @returns Download URL
 */
export const getFileUrl = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error getting file URL:", error);
    throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * List all files in a directory
 * @param path - Storage path of the directory
 * @returns Array of file references
 */
export const listFiles = async (path: string) => {
  try {
    const listRef = ref(storage, path);
    const result = await listAll(listRef);
    return result.items;
  } catch (error) {
    console.error("Error listing files:", error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Upload file for task attachment
 */
export const uploadTaskAttachment = async (file: File, taskId: string): Promise<UploadResult> => {
  return uploadFile(file, `tasks/${taskId}/attachments/`);
};

/**
 * Upload file for document
 */
export const uploadDocument = async (file: File, docId?: string): Promise<UploadResult> => {
  const path = docId ? `documents/${docId}/` : "documents/";
  return uploadFile(file, path);
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (file: File, userId: string): Promise<UploadResult> => {
  const fileName = `avatar_${userId}.${file.name.split('.').pop()}`;
  return uploadFile(file, "avatars/", fileName);
};

