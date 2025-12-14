// src/utils/navigationServices.js

import { db, auth } from '../firebase/config';
import firebase from '@react-native-firebase/app';
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

/**
 * Enters a Direct Message (DM) conversation. Creates the conversation document if needed.
 * @param {object} navigation - The navigation object from React Navigation.
 * @param {string} otherUserId - The ID of the other participant.
 * @param {string} otherUserName - The display name of the other participant.
 */
export const startDirectMessage = async (navigation, otherUserId, otherUserName) => {
    const currentUserId = auth.currentUser.uid;
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    const conversationRef = db.collection("conversations").doc(conversationId);
    
    // Ensure the conversation document exists (equivalent to setDoc({ merge: true }) in web SDK)
    await conversationRef.set({
        participants: [currentUserId, otherUserId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }, { merge: true });
    
    // Navigate to the Chat Screen with parameters
    navigation.navigate('Chat', {
        chatId: conversationId,
        chatType: 'dm',
        chatTitle: `Chat with ${otherUserName}`,
        otherUserId: otherUserId
    });
};

/**
 * Enters a Support Chat conversation. Creates the conversation document if needed.
 * @param {object} navigation - The navigation object from React Navigation.
 * @param {string} teamId - The ID of the support team ('technical_support' or 'coordinator').
 * @param {string} teamName - The display name of the support team.
 */
export const startSupportChat = async (navigation, teamId, teamName) => {
    const currentUserId = auth.currentUser.uid;
    const conversationId = `${currentUserId}_${teamId}`;
    const conversationRef = db.collection("supportConversations").doc(conversationId);

    // Ensure the support conversation document exists
    await conversationRef.set({
        studentId: currentUserId,
        teamId: teamId,
        updatedAt: serverTimestamp()
    }, { merge: true });

    // Navigate to the Chat Screen
    navigation.navigate('Chat', {
        chatId: conversationId,
        chatType: 'support',
        chatTitle: `Chat with ${teamName}`,
    });
};

/**
 * Enters a Paper Group Chat.
 * @param {object} navigation - The navigation object from React Navigation.
 * @param {string} paperId - The ID of the paper.
 * @param {string} paperName - The name of the paper.
 */
export const enterPaperGroupChat = (navigation, paperId, paperName) => {
    navigation.navigate('Chat', {
        chatId: paperId,
        chatType: 'group',
        chatTitle: paperName,
    });
};

/**
 * Enters a Doubt Chat.
 * @param {object} navigation - The navigation object from React Navigation.
 * @param {string} doubtId - The ID of the doubt.
 * @param {string} doubtTitle - The title of the doubt.
 */
export const enterDoubtChat = (navigation, doubtId, doubtTitle) => {
    navigation.navigate('Chat', {
        chatId: doubtId,
        chatType: 'doubt',
        chatTitle: `Doubt: ${doubtTitle}`,
    });
};