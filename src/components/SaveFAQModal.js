// src/components/SaveFAQModal.js

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { db, auth } from '../firebase/config';
import firebase from '@react-native-firebase/app';
const firestore = firebase.firestore;

const SaveFAQModal = ({ isVisible, onClose, paperId, topicId, initialQuestion, initialAnswer }) => {
    const [questionText, setQuestionText] = useState(initialQuestion || '');
    const [answerText, setAnswerText] = useState(initialAnswer || '');
    const [submitting, setSubmitting] = useState(false);
    
    // Reset state when modal opens/changes context
    useEffect(() => {
        setQuestionText(initialQuestion || '');
        setAnswerText(initialAnswer || '');
        setSubmitting(false);
    }, [initialQuestion, initialAnswer, isVisible]);

    const handleSubmitFAQ = async () => {
        const qText = questionText.trim();
        const aText = answerText.trim();

        if (!qText || !aText) {
            return Alert.alert('Missing Content', 'Please provide both a Question and an Answer.');
        }

        setSubmitting(true);
        const currentUserId = auth.currentUser.uid;

        try {
            await db.collection(`papers/${paperId}/topics/${topicId}/faqs`).add({
                questionText: qText,
                answerText: aText,
                questionMediaUrl: null, // Simplified: assuming text-only Q&A for this modal
                answerMediaUrl: null,
                answerMediaType: 'text',
                provenance: {
                    savedById: currentUserId,
                    savedAt: firestore.FieldValue.serverTimestamp(),
                }
            });

            Alert.alert('Success', 'FAQ saved successfully to the topic!');
            onClose();
            
        } catch (error) {
            console.error("FAQ submission error:", error);
            Alert.alert('Submission Failed', 'Failed to save FAQ. Check logs.');
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
                    <Text style={styles.modalTitle}>Save Message to FAQ</Text>
                    <Text style={styles.modalSubtitle}>Topic: #{topicId}</Text>
                    
                    <ScrollView style={{maxHeight: 450}}>
                        <Text style={styles.label}>Question (Source Message):</Text>
                        <TextInput
                            style={[styles.input, styles.questionInput]}
                            value={questionText}
                            onChangeText={setQuestionText}
                            multiline={true}
                            editable={!submitting}
                        />

                        <Text style={styles.label}>Answer (Subsequent Messages):</Text>
                        <TextInput
                            style={styles.input}
                            value={answerText}
                            onChangeText={setAnswerText}
                            multiline={true}
                            editable={!submitting}
                        />
                    </ScrollView>

                    <TouchableOpacity 
                        style={styles.submitButton} 
                        onPress={handleSubmitFAQ}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Save to FAQ</Text>
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
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#db2777', marginBottom: 5, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 15, textAlign: 'center' },
    
    label: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 10, marginBottom: 5 },
    input: {
        minHeight: 80,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 15,
        backgroundColor: 'white',
        textAlignVertical: 'top',
    },
    questionInput: {
        backgroundColor: '#f3f4f6', // Slight difference to indicate it's the source text
    },
    
    submitButton: {
        backgroundColor: '#10b981', // Green for saving
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    closeButton: {
        alignItems: 'center',
        padding: 5,
    },
    closeButtonText: {
        color: '#6b7280',
        fontSize: 14,
    }
});

export default SaveFAQModal;