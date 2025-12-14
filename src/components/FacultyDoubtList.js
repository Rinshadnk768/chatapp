// src/components/FacultyDoubtList.js (New Component)

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { db, auth } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';
import firebase from '@react-native-firebase/app';

// --- Import Utilities ---
import { enterDoubtChat } from '../utils/navigationServices'; 
import { useSLATimer } from '../hooks/useSLATimer'; // <-- SLA Timer Hook

const FacultyDoubtList = ({ paperId }) => {
    const navigation = useNavigation();
    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!currentUserId || !paperId) {
            setLoading(false);
            return;
        }

        // Query doubts for this paper, ordered by status (unassigned first) and then creation time
        const q = db.collection("doubts")
                    .where("paperId", "==", paperId)
                    .orderBy("status")
                    .orderBy("createdAt", "desc");

        const unsubscribe = q.onSnapshot(snapshot => {
            const fetchedDoubts = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamp to milliseconds for the hook
                    deadlineMillis: data.slaDeadline?.toMillis() || null, 
                };
            });
            setDoubts(fetchedDoubts);
            setLoading(false);
        }, error => {
            console.error("Error fetching faculty doubts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserId, paperId]);

    const DoubtItem = ({ item }) => {
        // Use the hook for real-time countdown
        const timeLeft = useSLATimer(item.deadlineMillis); 
        
        const isBreached = timeLeft === "SLA Breached";
        const statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1);
        
        // Dynamic styling based on timer status
        const timerStyle = isBreached 
            ? styles.timerBreached 
            : (item.deadlineMillis && (item.deadlineMillis - new Date().getTime() < 300000)) // Less than 5 mins
                ? styles.timerWarning 
                : styles.timerNormal;

        return (
            <View style={styles.doubtItem}>
                <View style={styles.doubtDetails}>
                    <Text style={styles.doubtTitle}>{item.title}</Text>
                    <Text style={styles.doubtStatus}>Status: {statusText}</Text>
                    
                    {/* Display the timer */}
                    <Text style={[styles.timerText, timerStyle]}>{timeLeft}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.openChatButton} 
                    onPress={() => enterDoubtChat(navigation, item.id, item.title)}
                >
                    <Text style={styles.openChatButtonText}>OPEN CHAT ➔</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#ec4899" style={styles.loading} />;
    }
    if (doubts.length === 0) {
        return <Text style={styles.emptyText}>No active doubts for this paper.</Text>;
    }

    return (
        <FlatList
            data={doubts}
            keyExtractor={(item) => item.id}
            renderItem={DoubtItem}
            contentContainerStyle={styles.listContainer}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: { padding: 10 },
    loading: { padding: 20 },
    emptyText: { textAlign: 'center', padding: 20, color: '#6b7280', fontStyle: 'italic' },
    doubtItem: {
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
    doubtDetails: { flex: 1, marginRight: 10 },
    doubtTitle: { fontWeight: '700', fontSize: 16, color: '#1f2937' },
    doubtStatus: { fontSize: 12, color: '#4b5563', marginTop: 2 },
    timerText: { fontSize: 12, fontWeight: 'bold', marginTop: 5 },
    timerNormal: { color: '#16a34a' }, // Green
    timerWarning: { color: '#f97316' }, // Orange
    timerBreached: { color: '#dc2626' }, // Red
    openChatButton: {
        backgroundColor: '#f97316', 
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    openChatButtonText: { color: 'white', fontWeight: '600', fontSize: 12 },
});

export default FacultyDoubtList;