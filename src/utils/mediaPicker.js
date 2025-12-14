// src/utils/mediaPicker.js (New/Updated content for image picking)

import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// NOTE: You would need to ensure the ImagePicker import is present in the file.

/**
 * Opens the native image library/camera with built-in cropping.
 * This replaces the web's getDisplayMedia + Cropper.js flow.
 * @returns {Promise<{uri: string, name: string}|null>} - Local URI and name of the cropped image.
 */
export const pickImageForDoubt = async () => {
    // 1. Request permissions (Camera/Media Library permissions must be in app.json)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photo library to select a doubt screenshot.');
        return null;
    }

    // 2. Launch image picker with editing/cropping enabled
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Enables the native cropping tool (replaces Cropper.js)
        aspect: [16, 9], // Recommended aspect ratio for screenshots
        quality: 0.9,
        base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // The asset contains the URI of the cropped image
        const filename = asset.uri.split('/').pop();
        return {
            uri: asset.uri,
            name: filename,
        };
    }
    return null;
};