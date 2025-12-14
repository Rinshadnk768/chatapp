// src/components/ConversationsList.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { db, auth } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';
import firebase from '@react-native-firebase/app';

// --- Import Utilities ---
import { startDirectMessage, enterSupportChat } from '../utils/navigationServices'; 
import { getUserData } from '../utils/userServices'; 

// Firestore FieldValue for ordering
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

/**
 * Renders a list of conversations (DM or Support).
 * @param {string} type - 'dm' for Direct Messages, 'support' for Faculty/Team Queries.
 * @param {string} [teamId=null] - Required if type is 'support' (e.g., 'technical_support').
 */
const ConversationsList = ({ type, teamId = null }) => {
    const navigation = useNavigation();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        let collectionRef;
        let queryRef;

        if (type === 'dm') {
            // Logic for DM list (Conversations collection)
            collectionRef = db.collection("conversations");
            queryRef = collectionRef
                .where("participants", "array-contains", currentUserId)
                .orderBy("updatedAt", "desc");
        } else if (type === 'support' && teamId) {
            // Logic for Support Queries (SupportConversations collection)
            collectionRef = db.collection("supportConversations");
            queryRef = collectionRef
                .where("teamId", "==", teamId)
                .orderBy("updatedAt", "desc");
        } else {
            setLoading(false);
            return;
        }

        const unsubscribe = queryRef.onSnapshot(async (querySnapshot) => {
            const convPromises = querySnapshot.docs.map(async (doc) => {
                const conversation = doc.data();
                let chatTitle = 'Conversation';
                let action = () => {};

                if (type === 'dm') {
                    // Find the other participant's ID
                    const otherUserId = conversation.participants.find(p => p !== currentUserId);
                    const otherUserData = await getUserData(otherUserId);
                    chatTitle = `Chat with ${otherUserData.displayName}`;
                    action = () => startDirectMessage(navigation, otherUserId, otherUserData.displayName);
                } else if (type === 'support') {
                    // Find the student's data
                    const studentData = await getUserData(conversation.studentId);
                    chatTitle = `Query from ${studentData.displayName}`;
                    action = () => enterSupportChat(navigation, doc.id, `Query from ${studentData.displayName}`);
                }

                let lastMessageText = "New conversation.";
                if (conversation.lastMessage) {
                    const msg = conversation.lastMessage;
                    lastMessageText = msg.messageType === 'text' 
                        ? msg.content 
                        : `Sent a ${msg.messageType}`;
                    if(msg.isForwarded) lastMessageText = `[Fwd] ${lastMessageText}`;
                }

                return {
                    id: doc.id,
                    chatTitle,
                    lastMessage: lastMessageText.substring(0, 30) + (lastMessageText.length > 30 ? '...' : ''),
                    action,
                };
            });
            
            const fetchedConversations = await Promise.all(convPromises);
            setConversations(fetchedConversations);
            setLoading(false);

        }, (error) => {
            console.error(`Error listening to ${type} conversations:`, error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserId, type, teamId]);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.listItem} onPress={item.action}>
            <View style={styles.titleContainer}>
                <Text style={styles.chatTitle}>{item.chatTitle}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            </View>
            <Text style={styles.openButtonText}>OPEN ➔</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return <ActivityIndicator size="small" color="#ec4899" style={styles.loading} />;
    }

    if (conversations.length === 0) {
        let emptyText = (type === 'dm') ? 'No direct messages yet.' : 'No active support queries.';
        return <Text style={styles.emptyText}>{emptyText}</Text>;
    }

    return (
        <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 8,
    },
    loading: {
        padding: 10,
    },
    emptyText: {
        textAlign: 'center',
        padding: 15,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        marginVertical: 4,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    titleContainer: {
        flex: 1,
        marginRight: 10,
    },
    chatTitle: {
        fontWeight: '700',
        fontSize: 16,
        color: '#1f2937',
    },
    lastMessage: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    openButtonText: {
        color: '#db2777', // Pink 600
        fontWeight: 'bold',
        fontSize: 12,
    }
});

export default ConversationsList;