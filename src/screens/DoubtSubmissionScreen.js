// src/screens/DoubtSubmissionScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { db, auth } from '../firebase/config';
import firebase from '@react-native-firebase/app';

// --- Import Utilities ---
import { pickImageForDoubt } from '../utils/mediaPicker'; 
import { uploadFile } from '../utils/firebaseUpload'; 

const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

const DoubtSubmissionScreen = ({ navigation }) => {
    const [papers, setPapers] = useState([]);
    const [selectedPaperId, setSelectedPaperId] = useState('');
    const [doubtTitle, setDoubtTitle] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the user's assigned papers (replaces populatePaperSelect)
        const fetchPapers = async () => {
            const currentUserId = auth.currentUser.uid;
            try {
                const userDoc = await db.collection("users").doc(currentUserId).get();
                const paperIds = userDoc.data()?.assignedPapers || [];
                
                if (paperIds.length > 0) {
                    const papersQuery = db.collection("papers").where(firebase.firestore.FieldPath.documentId(), 'in', paperIds);
                    const papersSnapshot = await papersQuery.get();
                    const fetchedPapers = papersSnapshot.docs.map(doc => ({
                        id: doc.id,
                        name: doc.data().paperName,
                        code: doc.data().subjectCode,
                    }));
                    setPapers(fetchedPapers);
                }
            } catch (e) {
                console.error("Error fetching papers:", e);
                Alert.alert("Error", "Failed to load assigned papers.");
            } finally {
                setLoading(false);
            }
        };
        fetchPapers();
    }, []);

    const handlePickImage = async () => {
        const fileInfo = await pickImageForDoubt(); // Use the new picker/cropper utility
        if (fileInfo) {
            setImageUri(fileInfo.uri);
        }
    };

    const handleSubmit = async () => {
        if (!selectedPaperId || !doubtTitle.trim()) {
            return Alert.alert("Missing Details", "Please select a paper and enter a doubt title.");
        }
        if (!imageUri) {
            return Alert.alert("Missing Image", "Please attach a screenshot for the doubt.");
        }

        setLoading(true);

        try {
            // 1. Upload the Image (handles URI -> Storage)
            const downloadURL = await uploadFile(imageUri, `doubt-screenshots/${auth.currentUser.uid}`);

            // 2. Submit Doubt to Firestore (replaces handleSubmitScreenshotDoubt)
            await db.collection("doubts").add({
                title: doubtTitle.trim(),
                paperId: selectedPaperId,
                studentId: auth.currentUser.uid,
                status: "unassigned",
                assignedFacultyId: null,
                createdAt: serverTimestamp(),
                imageUrl: downloadURL,
                hasScreenshot: true
            });

            Alert.alert("Success", "Doubt submitted successfully! You will be notified when it is assigned to a faculty member.");
            navigation.goBack(); // Return to dashboard

        } catch (error) {
            console.error("Error submitting doubt:", error);
            Alert.alert("Submission Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#ec4899" style={styles.loading} />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Ask a Doubt with Screenshot</Text>

                <TouchableOpacity style={styles.imageButton} onPress={handlePickImage} disabled={loading}>
                    <Text style={styles.imageButtonText}>
                        {imageUri ? '✅ Image Selected (Tap to Change)' : '📸 Select/Take Screenshot'}
                    </Text>
                </TouchableOpacity>

                {imageUri && (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.clearImageButton} onPress={() => setImageUri(null)}>
                            <Text style={styles.clearImageText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                <View style={styles.selectContainer}>
                    <Text style={styles.selectLabel}>Select Paper:</Text>
                    {/* Using basic TouchableOpacity/Text combo as Picker is complex to style across platforms */}
                    <TouchableOpacity style={styles.pickerDisplay} onPress={() => Alert.alert("Select Paper", "Use a native Picker/Dropdown component here.")}>
                        <Text>
                            {selectedPaperId 
                                ? papers.find(p => p.id === selectedPaperId)?.name 
                                : '-- Select a Paper --'
                            }
                        </Text>
                    </TouchableOpacity>
                    {/* NOTE: For production, you need a proper cross-platform Picker component */}
                    {papers.map(p => (
                        <TouchableOpacity 
                            key={p.id} 
                            style={selectedPaperId === p.id ? styles.pickerOptionSelected : styles.pickerOption}
                            onPress={() => setSelectedPaperId(p.id)}
                        >
                            <Text style={styles.pickerOptionText}>{p.name} ({p.code})</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="What is your doubt about this image/screenshot?"
                    value={doubtTitle}
                    onChangeText={setDoubtTitle}
                    multiline={true}
                    numberOfLines={4}
                />

                <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={handleSubmit} 
                    disabled={loading || !imageUri || !selectedPaperId}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Doubt</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    container: { padding: 20 },
    loading: { flex: 1, justifyContent: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', color: '#db2777', marginBottom: 20, textAlign: 'center' },
    
    // Image Picker Styles
    imageButton: {
        backgroundColor: '#f97316',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    imageButtonText: { color: 'white', fontWeight: 'bold' },
    imagePreviewContainer: { 
        alignItems: 'center', 
        marginBottom: 15, 
        borderWidth: 1, 
        borderColor: '#e5e7eb', 
        borderRadius: 8 
    },
    imagePreview: { width: '100%', height: 200, resizeMode: 'contain', borderRadius: 8 },
    clearImageButton: { 
        position: 'absolute', 
        top: 5, 
        right: 5, 
        backgroundColor: 'rgba(220, 38, 38, 0.8)', 
        padding: 5, 
        borderRadius: 5 
    },
    clearImageText: { color: 'white', fontSize: 12 },
    
    // Picker/Select Styles (Custom simplified UI)
    selectContainer: { marginBottom: 15 },
    selectLabel: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
    pickerDisplay: { 
        padding: 10, 
        backgroundColor: 'white', 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 4, 
        marginBottom: 8 
    },
    pickerOption: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: 'white' },
    pickerOptionSelected: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fbcfe8' },
    pickerOptionText: { color: '#1f2937' },
    
    // Form Styles
    input: {
        minHeight: 100,
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
        backgroundColor: '#ec4899',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});

export default DoubtSubmissionScreen;