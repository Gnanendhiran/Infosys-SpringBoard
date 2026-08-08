import { storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const firebaseStorageService = {
    /**
     * Upload a file to Firebase Storage
     * @param file - File to upload
     * @param path - Storage path (e.g., 'userId/filename.pdf')
     * @returns Promise with public URL
     */
    async uploadFile(file: File, path: string): Promise<string> {
        const storageRef = ref(storage, `resumes/${path}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return url;
    },

    /**
     * Get download URL for a file
     * @param path - Storage path
     * @returns Download URL
     */
    async getDownloadUrl(path: string): Promise<string> {
        // Check if path already contains "resumes/" prefix or is a full URL
        let storagePath = path;
        if (path.startsWith('http')) return path;

        if (!path.startsWith('resumes/')) {
            storagePath = `resumes/${path}`;
        }

        const storageRef = ref(storage, storagePath);
        return await getDownloadURL(storageRef);
    },

    /**
     * Delete a file from storage
     * @param path - Storage path
     */
    async deleteFile(path: string): Promise<void> {
        const storageRef = ref(storage, `resumes/${path}`);
        await deleteObject(storageRef);
    }
};
