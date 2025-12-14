// src/utils/userServices.js
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import firebase from '@react-native-firebase/app';

// Global in-memory cache for user data
// This prevents excessive reads from Firestore for the same user repeatedly
const userCache = new Map();

// Default avatar URL (as used in your original HTML for fallback)
const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' clip-rule='evenodd' /%3E%3C/svg%3E";

/**
 * Fetches user data from cache or Firestore.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} - User data object: { displayName, photoURL, role, ... }
 */
export const getUserData = async (userId) => {
    if (!userId) return { displayName: 'N/A', photoURL: defaultAvatar };
    
    // 1. Handle System/Non-User IDs
    if (userId === 'system') return { displayName: 'System', photoURL: defaultAvatar, role: 'system' };
    
    // 2. Check Cache for immediate return
    if (userCache.has(userId)) {
        return userCache.get(userId);
    }
    
    // 3. Fetch from Firestore
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const finalData = {
                displayName: userData.displayName || 'Unknown User',
                photoURL: userData.photoURL || defaultAvatar,
                role: userData.role || 'student',
                // Include other common fields you might need globally
                // ...
            };
            
            // 4. Update Cache and Return
            userCache.set(userId, finalData);
            return finalData;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
    
    // 5. Fallback for missing or error-prone user document
    const fallbackData = { displayName: `User ${userId.substring(0, 4)}...`, photoURL: defaultAvatar, role: 'unknown' };
    userCache.set(userId, fallbackData);
    return fallbackData;
};

/**
 * React Hook to fetch user data for a specific component (e.g., a MessageBubble).
 * It manages the loading state and uses the global cache for efficiency.
 * @param {string} userId - The ID of the user whose data is needed.
 * @returns {object} - { displayName, photoURL, role }
 */
export const useUserCache = (userId) => {
    // Set initial state to cached data or a loading placeholder
    const [userData, setUserData] = useState(
        userCache.has(userId) 
            ? userCache.get(userId) 
            : { displayName: 'Loading...', photoURL: defaultAvatar, role: 'loading' }
    );

    useEffect(() => {
        let isMounted = true;
        
        const loadUser = async () => {
            if (!userId) return;
            
            // Check cache again in case the data was loaded by another component 
            // before this component mounted (e.g., during the initial render check above)
            if (userCache.has(userId)) {
                if (isMounted) setUserData(userCache.get(userId));
                return;
            }
            
            // Fetch the data and update state
            const data = await getUserData(userId);
            if (isMounted) {
                setUserData(data);
            }
        };

        loadUser();

        // Cleanup function to prevent setting state on unmounted components
        return () => { isMounted = false; };
    }, [userId]); // Re-run effect only if the userId changes

    return userData;
};