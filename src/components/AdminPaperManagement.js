// src/components/AdminPaperManagement.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import { db, auth } from '../firebase/config';
import firebase from '@react-native-firebase/app';

// The function to create a paper (replaces HTML form submit)
const handleCreatePaper = async (paperName, subjectCode, setPaperName, setSubjectCode) => {
    if (!paperName || !subjectCode) {
        Alert.alert('Missing Field', 'Please enter both Paper Name and Subject Code.');
        return;
    }
    try {
        await db.collection("papers").add({ paperName, subjectCode, studentIds: [], facultyIds: [] });
        Alert.alert('Success', `Paper '${paperName}' created!`);
        setPaperName('');
        setSubjectCode('');
    } catch (error) {
        console.error("Error creating paper:", error);
        Alert.alert('Error', 'Failed to create paper.');
    }
};

const AdminPaperManagement = ({ openManagementModal }) => {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPaperName, setNewPaperName] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState('');

    useEffect(() => {
        // Listen to all papers (replaces fetchAllPapers)
        const q = db.collection("papers").orderBy("paperName");
        const unsubscribe = q.onSnapshot((querySnapshot) => {
            const fetchedPapers = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPapers(fetchedPapers);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching papers:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.paperItem}
            onPress={() => openManagementModal(item.id, item.paperName)}
        >
            <View>
                <Text style={styles.paperTitle}>{item.paperName}</Text>
                <Text style={styles.paperCode}>{item.subjectCode}</Text>
            </View>
            <Text style={styles.manageText}>MANAGE ➔</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return <ActivityIndicator size="large" color="#ec4899" style={styles.loading} />;
    }

    return (
        <View style={styles.container}>
            {/* Create Paper Form (Replaces #create-paper-form) */}
            <View style={styles.createForm}>
                <Text style={styles.formHeader}>Create New Paper</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Paper Name (e.g., Advanced Calculus)"
                    value={newPaperName}
                    onChangeText={setNewPaperName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Subject Code (e.g., MA-301)"
                    value={newSubjectCode}
                    onChangeText={setNewSubjectCode}
                />
                <TouchableOpacity 
                    style={styles.createButton} 
                    onPress={() => handleCreatePaper(newPaperName, newSubjectCode, setNewPaperName, setNewSubjectCode)}
                >
                    <Text style={styles.createButtonText}>Create Paper</Text>
                </TouchableOpacity>
            </View>

            {/* Existing Papers List */}
            <Text style={styles.listHeader}>Existing Papers</Text>
            <FlatList
                data={papers}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.emptyText}>No papers created yet.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    loading: { padding: 20 },
    createForm: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        elevation: 1,
    },
    formHeader: { fontSize: 18, fontWeight: 'bold', color: '#db2777', marginBottom: 10 },
    input: {
        height: 40,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    createButton: {
        backgroundColor: '#f97316',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
    },
    createButtonText: { color: 'white', fontWeight: 'bold' },
    listHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
    paperItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        marginVertical: 4,
        borderRadius: 6,
        elevation: 2,
    },
    paperTitle: { fontWeight: '700', fontSize: 16 },
    paperCode: { fontSize: 12, color: '#6b7280' },
    manageText: { color: '#db2777', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', padding: 10, color: '#6b7280' },
});

export default AdminPaperManagement;