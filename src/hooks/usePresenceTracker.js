// src/hooks/usePresenceTracker.js

import { useEffect, useState } from 'react';
import { rtdb, auth, db } from '../firebase/config';
import firebase from '@react-native-firebase/app';
// The native RTDB SDK's way to get server timestamp
const rtdbServerTimestamp = firebase.database.ServerValue.TIMESTAMP; 

// Global in-memory cache for presence status (used by other components)
export const presenceStatusCache = new Map();

/**
 * Hook to manage user's own online/offline status in RTDB
 * and to listen for all users' status changes.
 */
export const usePresenceTracker = () => {
    const [isPresenceEnabled, setIsPresenceEnabled] = useState(false);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!currentUserId) return;

        // 1. Fetch Global Settings to check if feature is enabled (as in web app)
        const fetchSettings = async () => {
            try {
                const settingsDoc = await db.collection("settings").doc("global").get();
                const enabled = settingsDoc.exists && settingsDoc.data().presenceEnabled === true;
                setIsPresenceEnabled(enabled);
            } catch (error) {
                console.error("Error fetching presence settings:", error);
            }
        };
        fetchSettings();
    }, [currentUserId]);


    useEffect(() => {
        if (!currentUserId || !isPresenceEnabled) return;

        const userStatusRef = rtdb.ref(`/status/${currentUserId}`);
        const isOfflineForDatabase = { isOnline: false, last_changed: rtdbServerTimestamp };
        const isOnlineForDatabase = { isOnline: true, last_changed: rtdbServerTimestamp };

        // 2. Set up connectivity and onDisconnect handler (Replaces web's setupPresence)
        const connectedRef = rtdb.ref('.info/connected');
        const connectedListener = connectedRef.on('value', (snapshot) => {
            if (snapshot.val() === true) {
                // Set status to offline on disconnect
                userStatusRef.onDisconnect().set(isOfflineForDatabase).then(() => {
                    // Set status to online immediately
                    userStatusRef.set(isOnlineForDatabase);
                });
            }
        });
        
        // 3. Set up listener for all user statuses (updates global cache)
        const statusRef = rtdb.ref('status');
        const statusListener = statusRef.on('value', (snapshot) => {
            const statuses = snapshot.val() || {};
            presenceStatusCache.clear();
            for (const uid in statuses) {
                presenceStatusCache.set(uid, statuses[uid]);
            }
        });

        // Cleanup: Remove listeners and set user offline manually on unmount/logout
        return () => {
            connectedRef.off('value', connectedListener);
            statusRef.off('value', statusListener);
            userStatusRef.set(isOfflineForDatabase);
        };
    }, [currentUserId, isPresenceEnabled]);

    return isPresenceEnabled;
};