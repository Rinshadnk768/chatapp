// src/utils/firebaseUpload.js

import { storage } from '../firebase/config';

export const uploadFile = async (localUri, path) => {
  // Fix for Android using 'file://' URIs
  const filename = localUri.split('/').pop();
  const storagePath = `${path}/${Date.now()}-${filename}`;
  const storageRef = storage.ref(storagePath);

  // 1. Convert the local file URI to a Blob
  const response = await fetch(localUri);
  const blob = await response.blob();

  // 2. Upload the Blob
  try {
    // Equivalent to uploadBytes
    await storageRef.put(blob); 
    
    // 3. Get the Download URL
    const downloadURL = await storageRef.getDownloadURL();
    return downloadURL;

  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};