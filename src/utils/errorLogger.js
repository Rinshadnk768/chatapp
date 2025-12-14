// src/utils/errorLogger.js

import { Alert } from 'react-native';

/**
 * Handles errors gracefully by logging them to the console and showing a user-friendly alert.
 * @param {Error} error - The error object caught.
 * @param {string} source - The source/component where the error occurred (e.g., "ChatService", "LoginScreen").
 * @param {string} userMessage - A friendly message to show the user.
 */
export const logError = (error, source, userMessage = "An unexpected error occurred.") => {
    // 1. Log detailed error to console (for developer debugging)
    console.error(`[APP_ERROR] Source: ${source}`, error);
    
    // 2. Show user-friendly alert (hides technical details)
    Alert.alert(
        "Application Error", 
        userMessage + "\nPlease try again. If the issue persists, contact support.",
        [
            { text: "OK" }
        ],
        { cancelable: true }
    );
};