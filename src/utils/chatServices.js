// src/utils/chatServices.js

import { db, auth } from '../firebase/config';
import firebase from '@react-native-firebase/app';
// The native SDK's way to get the server timestamp
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp; 

/**
 * Sends a message to the specified chat (Group, DM, Doubt, or Support).
 * This function also handles auto-assignment for new doubt messages sent by Faculty.
 * * @param {string} chatId - ID of the conversation (Paper ID, Conversation ID, or Doubt ID).
 * @param {string} chatType - Type of chat ('group', 'dm', 'doubt', 'support').
 * @param {string} content - The message content (text, URL for media).
 * @param {string} type - Message type ('text', 'image', 'audio', 'poll', etc.).
 * @param {string} [fileName=null] - Original file name for media uploads.
 * @param {string} [pollId=null] - ID of the poll document.
 * @param {string} [topicId='general'] - Topic ID for group chats.
 */
export const sendMessage = async (
    chatId, 
    chatType, 
    content, 
    type, 
    fileName = null, 
    pollId = null, 
    topicId = 'general'
) => {
    if (!auth.currentUser) throw new Error("User not authenticated.");

    const senderId = auth.currentUser.uid;
    const isFaculty = ['faculty', 'technical_support', 'coordinator', 'admin', 'superadmin'].includes(auth.currentUser.role); // Role check needs to be fetched from user doc/claims

    let messageData = {
        senderId,
        content,
        messageType: type,
        timestamp: serverTimestamp(),
        seenBy: [senderId],
    };
    if (fileName) messageData.fileName = fileName;
    if (pollId) messageData.pollId = pollId;

    let collectionRef;
    let parentDocRef = null;

    try {
        switch (chatType) {
            case 'doubt':
                collectionRef = db.collection('messages');
                messageData.doubtId = chatId;

                // --- Doubt Assignment Logic (from web app) ---
                if (isFaculty) {
                    const doubtRef = db.collection("doubts").doc(chatId);
                    const doubtSnap = await doubtRef.get();

                    if (doubtSnap.exists && doubtSnap.data().status === 'unassigned') {
                        await doubtRef.update({
                            status: 'assigned',
                            assignedFacultyId: senderId
                        });

                        // Add a system message to the chat
                        const userData = await db.collection('users').doc(senderId).get();
                        const displayName = userData.data()?.displayName || 'Faculty Member';
                        
                        const systemMessageContent = `${displayName} has taken this doubt.`;
                        await collectionRef.add({
                            senderId: 'system',
                            content: systemMessageContent,
                            messageType: 'system',
                            doubtId: chatId,
                            timestamp: serverTimestamp()
                        });
                    }
                }
                break;

            case 'group':
                collectionRef = db.collection('paperMessages');
                messageData.paperId = chatId;
                messageData.topicId = topicId;
                break;

            case 'dm':
                parentDocRef = db.collection('conversations').doc(chatId);
                collectionRef = parentDocRef.collection('messages');
                break;

            case 'support':
                parentDocRef = db.collection('supportConversations').doc(chatId);
                collectionRef = parentDocRef.collection('messages');
                break;

            default:
                throw new Error("Invalid chat type provided.");
        }

        const docRef = await collectionRef.add(messageData);

        // Update parent document with last message (for DM/Support list previews)
        if (parentDocRef) {
            const finalMessageData = { ...messageData, id: docRef.id };
            await parentDocRef.set({ 
                lastMessage: finalMessageData, 
                updatedAt: serverTimestamp() 
            }, { merge: true });
        }
    } catch (error) {
        console.error("Error sending message:", error);
        throw new Error(`Failed to send message: ${error.message}`);
    }
};