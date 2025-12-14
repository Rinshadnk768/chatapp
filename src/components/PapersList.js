// src/components/PapersList.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { db, auth } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';

// --- Import Utilities ---
import { enterPaperGroupChat, enterDoubtChat } from '../utils/navigationServices'; 
import { getUserData } from '../utils/userServices'; // Used to get user role/data

const PapersList = () => {
    const navigation = useNavigation();
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        
        const fetchData = async () => {
            try {
                // 1. Get user role and assigned paper IDs (replaces web's getDoc)
                const userData = await getUserData(currentUserId);
                if (!userData) {
                    if (isMounted) setLoading(false);
                    return;
                }
                
                const userDocSnap = await db.collection("users").doc(currentUserId).get();
                const paperIds = userDocSnap.data()?.assignedPapers || [];
                
                if (isMounted) setUserRole(userData.role);

                if (paperIds.length === 0) {
                    if (isMounted) {
                        setPapers([]);
                        setLoading(false);
                    }
                    return;
                }

                // 2. Listen for paper details (replaces web's query(where("__name__", "in", paperIds)))
                // We use a simple getDocs here since the list of papers changes infrequently
                const papersRef = db.collection('papers').where(firebase.firestore.FieldPath.documentId(), 'in', paperIds);
                const snapshot = await papersRef.get();
                
                if (isMounted) {
                    const fetchedPapers = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setPapers(fetchedPapers);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching papers:", error);
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [currentUserId]);

    const handleViewDoubts = (paperId, paperName) => {
        // NOTE: This will require creating a dedicated DoubtListScreen later
        Alert.alert("Doubt Feature", `Navigating to doubts list for ${paperName} is not yet implemented.`);
        // To use the doubt chat directly, you would navigate like this:
        // enterDoubtChat(navigation, 'DOUBT_ID_PLACEHOLDER', 'Doubt Title');
    };

    const renderItem = ({ item }) => {
        const isStudent = userRole === 'student';

        return (
            <View style={styles.paperItem}>
                <View style={styles.paperTitleContainer}>
                    <Text style={styles.paperTitle}>{item.paperName}</Text>
                    <Text style={styles.paperCode}>{item.subjectCode}</Text>
                </View>
                <View style={styles.buttonGroup}>
                    <TouchableOpacity 
                        style={styles.chatButton} 
                        onPress={() => enterPaperGroupChat(navigation, item.id, item.paperName)}
                    >
                        <Text style={styles.buttonText}>💬 Group Chat</Text>
                    </TouchableOpacity>
                    
                    {/* Doubts button only appears for Student/Faculty roles */}
                    <TouchableOpacity 
                        style={styles.doubtsButton} 
                        onPress={() => handleViewDoubts(item.id, item.paperName)}
                    >
                        <Text style={styles.buttonText}>
                            {isStudent ? '❓ My Doubts' : '❓ View Doubts'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#ec4899" style={styles.loading} />;
    }

    if (papers.length === 0) {
        return (
            <Text style={styles.emptyText}>
                You are not assigned to any papers.
            </Text>
        );
    }

    return (
        <FlatList
            data={papers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        padding: 16,
    },
    loading: {
        padding: 20,
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    paperItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        marginVertical: 6,
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    paperTitleContainer: {
        flex: 1,
        marginRight: 10,
    },
    paperTitle: {
        fontWeight: '700',
        fontSize: 16,
        color: '#1f2937',
    },
    paperCode: {
        fontSize: 12,
        color: '#6b7280',
    },
    buttonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatButton: {
        backgroundColor: '#10b981', // Group Chat Button Color
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginLeft: 8,
    },
    doubtsButton: {
        backgroundColor: '#ec4899', // Doubts Button Color
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginLeft: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
});

export default PapersList;