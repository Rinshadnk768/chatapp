// src/components/PollCreationModal.js

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { db, auth } from '../firebase/config';
import firebase from '@react-native-firebase/app';
import { sendMessage } from '../utils/chatServices'; // Reuse sendMessage to send the poll notification

const PollCreationModal = ({ isVisible, onClose, paperId, topicId }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [submitting, setSubmitting] = useState(false);
    const minOptions = 2;

    const handleOptionChange = (text, index) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    const handleAddOption = () => {
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index) => {
        if (options.length > minOptions) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        } else {
            Alert.alert("Cannot Remove", `A poll must have at least ${minOptions} options.`);
        }
    };

    const handleSubmitPoll = async () => {
        const trimmedQuestion = question.trim();
        const validOptions = options.map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (!trimmedQuestion || validOptions.length < minOptions) {
            Alert.alert('Missing Fields', `Please enter a question and at least ${minOptions} valid options.`);
            return;
        }

        setSubmitting(true);

        try {
            // 1. Create Poll Document
            const pollRef = db.collection("polls").doc();
            const pollData = {
                paperId,
                topicId,
                question: trimmedQuestion,
                options: validOptions.map(opt => ({ text: opt, count: 0 })),
                creatorId: auth.currentUser.uid,
                voters: [], // Array to store UIDs of voters
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await pollRef.set(pollData);

            // 2. Send Message to the Chat (Poll Notification)
            const pollMessageContent = `📊 A new poll has been started: ${trimmedQuestion}`;
            await sendMessage(
                paperId, 
                'group', 
                pollMessageContent, 
                'poll', // Message type 'poll'
                null, 
                pollRef.id, // Pass the poll ID
                topicId
            );

            Alert.alert('Success', 'Poll created and announced in the chat!');
            setQuestion('');
            setOptions(['', '']);
            onClose();

        } catch (error) {
            console.error("Poll creation error:", error);
            Alert.alert('Submission Failed', 'Failed to create poll. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Create New Poll</Text>
                    <Text style={styles.modalSubtitle}>For: {paperId} / Topic: {topicId}</Text>

                    <ScrollView style={{ maxHeight: 400 }}>
                        <TextInput
                            style={styles.input}
                            placeholder="Poll Question (e.g., Which topic is hardest?)"
                            value={question}
                            onChangeText={setQuestion}
                            editable={!submitting}
                        />

                        <Text style={styles.optionsHeader}>Options:</Text>
                        {options.map((option, index) => (
                            <View key={index} style={styles.optionRow}>
                                <TextInput
                                    style={styles.optionInput}
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChangeText={(text) => handleOptionChange(text, index)}
                                    editable={!submitting}
                                />
                                {options.length > minOptions && (
                                    <TouchableOpacity style={styles.removeOptionButton} onPress={() => handleRemoveOption(index)}>
                                        <Text style={styles.removeOptionText}>&times;</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                        
                        <TouchableOpacity style={styles.addOptionButton} onPress={handleAddOption} disabled={submitting}>
                            <Text style={styles.addOptionText}>+ Add Option</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <TouchableOpacity 
                        style={styles.submitButton} 
                        onPress={handleSubmitPoll}
                        disabled={submitting || question.trim() === '' || options.length < minOptions}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Launch Poll</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={submitting}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: {
        width: '90%', maxWidth: 500, backgroundColor: 'white', borderRadius: 10, padding: 25, 
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#f97316', marginBottom: 5, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
    
    input: {
        height: 40,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    optionsHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    optionInput: {
        flex: 1,
        height: 40,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    removeOptionButton: {
        backgroundColor: '#ef4444',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeOptionText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    addOptionButton: {
        backgroundColor: '#10b981',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 20,
    },
    addOptionText: { color: 'white', fontWeight: 'bold' },
    
    submitButton: {
        backgroundColor: '#ec4899',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    closeButton: { alignItems: 'center', padding: 5 },
    closeButtonText: { color: '#6b7280', fontSize: 14 },
});

export default PollCreationModal;