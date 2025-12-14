// src/components/TopicsSidebar.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { db, auth } from '../firebase/config';
import PollCreationModal from './PollCreationModal'; // <-- IMPORTED

const TopicsSidebar = ({ paperId, currentTopicId, setCurrentTopicId, currentViewMode, setCurrentViewMode }) => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pollModalVisible, setPollModalVisible] = useState(false); // <-- NEW STATE
    const currentUserRole = auth.currentUser?.role; 

    useEffect(() => {
        if (!paperId) return;

        // Listen for all topics for the current paper
        const q = db.collection(`papers/${paperId}/topics`).orderBy('name');

        const unsubscribe = q.onSnapshot((querySnapshot) => {
            const fetchedTopics = [];
            querySnapshot.forEach(doc => {
                fetchedTopics.push({ id: doc.id, ...doc.data() });
            });
            setTopics(fetchedTopics);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching topics:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [paperId]);

    const allTopics = [
        { id: 'general', name: 'General', createdBy: 'system' }, // Default topic
        ...topics
    ];
    
    // --- Handlers ---
    const handleTopicSwitch = (topicId) => {
        setCurrentTopicId(topicId);
        setCurrentViewMode('chat'); // Always switch back to chat view
    };

    const handleViewFAQs = () => {
        setCurrentViewMode('faq');
    };
    
    const handleCreateTopic = () => {
         // TODO: Open Topic Creation Modal
         Alert.alert("Create Topic", "Opening Topic Creation Modal (Placeholder)");
    };
    
    const handleCreatePoll = () => { // <-- NEW HANDLER
        setPollModalVisible(true);
    };

    const renderTopicItem = ({ item }) => {
        const isActive = item.id === currentTopicId;
        return (
            <TouchableOpacity
                style={[styles.topicItem, isActive && currentViewMode === 'chat' && styles.topicItemActive]}
                onPress={() => handleTopicSwitch(item.id)}
            >
                <Text style={[styles.topicText, isActive && currentViewMode === 'chat' && styles.topicTextActive]}>
                    # {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return <ActivityIndicator size="small" color="#ec4899" style={styles.loading} />;
    }
    
    // Determine if the user is staff (Faculty, Admin, etc.)
    const isStaff = ['faculty', 'admin', 'superadmin', 'technical_support', 'coordinator'].includes(currentUserRole);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Topics</Text>
            </View>

            <FlatList
                data={allTopics}
                keyExtractor={(item) => item.id}
                renderItem={renderTopicItem}
                style={styles.topicList}
            />

            <View style={styles.footer}>
                {/* View FAQs Button */}
                <TouchableOpacity
                    style={[styles.faqButton, currentViewMode === 'faq' && styles.faqButtonActive]}
                    onPress={handleViewFAQs}
                >
                    <Text style={styles.faqButtonText}>
                        📚 View FAQs
                    </Text>
                </TouchableOpacity>

                {/* Create Topic Button (Staff only) */}
                {isStaff && (
                    <TouchableOpacity
                        style={styles.createTopicButton}
                        onPress={handleCreateTopic}
                    >
                        <Text style={styles.createTopicButtonText}>+ Create Topic</Text>
                    </TouchableOpacity>
                )}
                
                {/* Create Poll Button (Staff only) */}
                {isStaff && (
                    <TouchableOpacity
                        style={styles.createPollButton} // <-- NEW BUTTON STYLE
                        onPress={handleCreatePoll}
                    >
                        <Text style={styles.createTopicButtonText}>+ Create Poll</Text>
                    </TouchableOpacity>
                )}
            </View>
            
            {/* --- Poll Modal Render --- */}
            <PollCreationModal
                isVisible={pollModalVisible}
                onClose={() => setPollModalVisible(false)}
                paperId={paperId}
                topicId={currentTopicId}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 200, 
        borderRightWidth: 1, 
        borderColor: '#e5e7eb', 
        backgroundColor: 'white',
        paddingVertical: 10,
    },
    header: {
        paddingHorizontal: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#db2777',
    },
    topicList: {
        flex: 1,
        paddingHorizontal: 10,
        paddingTop: 5,
    },
    topicItem: {
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderRadius: 5,
        marginVertical: 2,
    },
    topicItemActive: {
        backgroundColor: '#ec4899', // Pink background
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    topicText: {
        color: '#4b5563',
        fontWeight: '500',
        fontSize: 14,
    },
    topicTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    footer: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    faqButton: {
        backgroundColor: '#f97316', 
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 5,
    },
    faqButtonActive: {
        backgroundColor: '#ef4444', // Slightly different color when FAQ view is active
    },
    faqButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    createTopicButton: {
        backgroundColor: '#6b7280',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 5, // Space between Topic and Poll button
    },
    createTopicButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    createPollButton: { // <-- NEW STYLE
        backgroundColor: '#ec4899', // Pink color for Polls
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    loading: {
        padding: 20,
    }
});

export default TopicsSidebar;