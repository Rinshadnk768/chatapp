// src/screens/StudentMyDoubtsScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { db, auth } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';

const StudentMyDoubtsScreen = () => {
    const navigation = useNavigation();
    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        // Listen for all doubts submitted by the current student
        const q = db.collection("doubts")
                    .where("studentId", "==", currentUserId)
                    .orderBy("createdAt", "desc");

        const unsubscribe = q.onSnapshot(snapshot => {
            const fetchedDoubts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isAssigned: doc.data().status !== 'unassigned'
            }));
            setDoubts(fetchedDoubts);
            setLoading(false);
        }, error => {
            console.error("Error fetching student doubts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    const handleEnterChat = (doubtId, title) => {
        navigation.navigate('Chat', {
            chatId: doubtId,
            chatType: 'doubt',
            chatTitle: `Doubt: ${title}`,
        });
    };

    const renderItem = ({ item }) => {
        const statusStyle = item.status === 'resolved' ? styles.statusResolved : 
                            item.status === 'assigned' ? styles.statusAssigned : styles.statusUnassigned;
        
        const chatEnabled = item.isAssigned;

        return (
            <View style={styles.doubtItem}>
                <View style={styles.doubtDetails}>
                    <Text style={styles.doubtTitle}>{item.title}</Text>
                    <Text style={[styles.doubtStatus, statusStyle]}>{item.status.toUpperCase()}</Text>
                    <Text style={styles.doubtDate}>
                        Submitted: {item.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={[styles.chatButton, chatEnabled ? styles.chatButtonEnabled : styles.chatButtonDisabled]} 
                    onPress={() => chatEnabled ? handleEnterChat(item.id, item.title) : null}
                    disabled={!chatEnabled}
                >
                    <Text style={styles.chatButtonText}>
                        {chatEnabled ? 'OPEN CHAT 💬' : 'PENDING ⏳'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#ec4899" style={styles.loading} />;
    }

    return (
        <FlatList
            data={doubts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.emptyText}>You haven't submitted any doubts yet.</Text>}
            contentContainerStyle={styles.listContainer}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: { padding: 16 },
    loading: { padding: 20 },
    emptyText: { textAlign: 'center', padding: 20, color: '#6b7280', fontStyle: 'italic' },
    doubtItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        marginVertical: 6,
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    doubtDetails: { flex: 1, marginRight: 10 },
    doubtTitle: { fontWeight: '700', fontSize: 16, color: '#1f2937' },
    doubtStatus: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
    doubtDate: { fontSize: 12, color: '#6b7280' },
    
    statusUnassigned: { color: '#f97316' }, // Orange
    statusAssigned: { color: '#2563eb' },   // Blue
    statusResolved: { color: '#10b981' },   // Green
    
    chatButton: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    chatButtonEnabled: {
        backgroundColor: '#db2777', // Pink
    },
    chatButtonDisabled: {
        backgroundColor: '#a1a1aa', // Gray
    },
    chatButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
});

export default StudentMyDoubtsScreen;