// src/components/RatingModal.js

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { db } from '../firebase/config';
import firebase from '@react-native-firebase/app';
const firestore = firebase.firestore;

const RatingModal = ({ isVisible, onClose, doubtId, facultyId, studentId, paperId }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // Star characters for UI representation
    const emptyStar = '☆';
    const fullStar = '★';

    const handleRating = async () => {
        if (rating === 0) {
            Alert.alert('Missing Rating', 'Please select a star rating before submitting.');
            return;
        }
        setSubmitting(true);

        try {
            // Use a transaction to safely update the faculty's rating stats
            await db.runTransaction(async (transaction) => {
                // 1. Update Faculty User Document (Rating Aggregation)
                const facultyRef = db.collection('users').doc(facultyId);
                const facultyDoc = await transaction.get(facultyRef);
                
                if (facultyDoc.exists) {
                    const data = facultyDoc.data();
                    const newTotalRating = (data.totalRating || 0) + rating;
                    const newRatingCount = (data.ratingCount || 0) + 1;
                    
                    transaction.update(facultyRef, {
                        totalRating: newTotalRating,
                        ratingCount: newRatingCount,
                    });
                }
                
                // 2. Submit the rating record
                const ratingData = {
                    doubtId,
                    facultyId,
                    studentId,
                    paperId,
                    rating,
                    comment,
                    submittedAt: firestore.FieldValue.serverTimestamp(),
                };
                transaction.set(db.collection('ratings').doc(), ratingData);
                
                // 3. Mark the doubt as rated (Optional cleanup step)
                transaction.update(db.collection('doubts').doc(doubtId), { rated: true });
            });

            Alert.alert('Success', 'Rating submitted successfully!');
            onClose();
            
        } catch (error) {
            console.error("Rating submission error:", error);
            Alert.alert('Submission Failed', 'Failed to submit rating. Please try again.');
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
                    <Text style={styles.modalTitle}>Rate Faculty Service</Text>
                    <Text style={styles.modalSubtitle}>Doubt ID: {doubtId}</Text>
                    
                    <View style={styles.starContainer}>
                        {[1, 2, 3, 4, 5].map((starValue) => (
                            <TouchableOpacity 
                                key={starValue}
                                onPress={() => setRating(starValue)}
                                disabled={submitting}
                            >
                                <Text style={styles.star}>
                                    {starValue <= rating ? fullStar : emptyStar}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Optional comments on the service..."
                        value={comment}
                        onChangeText={setComment}
                        multiline={true}
                        numberOfLines={4}
                        editable={!submitting}
                    />

                    <TouchableOpacity 
                        style={styles.submitButton} 
                        onPress={handleRating}
                        disabled={submitting || rating === 0}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Rating</Text>
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
        width: '90%', maxWidth: 400, backgroundColor: 'white', borderRadius: 10, padding: 25, 
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#db2777', marginBottom: 5, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
    
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    star: {
        fontSize: 40,
        color: '#f59e0b', // Amber color for stars
        marginHorizontal: 5,
    },
    
    commentInput: {
        minHeight: 80,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 20,
        backgroundColor: 'white',
        textAlignVertical: 'top',
    },
    
    submitButton: {
        backgroundColor: '#f97316',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
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

export default RatingModal;