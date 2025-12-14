// src/components/PaperManagementModal.js

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, FlatList } from 'react-native';
import { db } from '../firebase/config';
import firebase from '@react-native-firebase/app';
const arrayUnion = firebase.firestore.FieldValue.arrayUnion;
const arrayRemove = firebase.firestore.FieldValue.arrayRemove;

const PaperManagementModal = ({ isVisible, onClose, paperId, paperName }) => {
    const [loading, setLoading] = useState(true);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [assignedFaculty, setAssignedFaculty] = useState([]);
    const [availableFaculty, setAvailableFaculty] = useState([]);

    useEffect(() => {
        if (!isVisible || !paperId) return;
        fetchPaperDetails();
    }, [isVisible, paperId]);

    const fetchPaperDetails = async () => {
        setLoading(true);
        try {
            const paperDoc = await db.collection("papers").doc(paperId).get();
            if (!paperDoc.exists) return Alert.alert("Error", "Paper not found.");
            
            const paperData = paperDoc.data();
            const enrolledStudentIds = paperData.studentIds || [];
            const assignedFacultyIds = paperData.facultyIds || [];

            // Fetch all users (Faculty and Students)
            const usersSnapshot = await db.collection("users").get();
            let allStudents = [];
            let allFaculty = [];

            usersSnapshot.forEach(doc => {
                const user = { id: doc.id, ...doc.data() };
                if (user.role === 'student') {
                    if (enrolledStudentIds.includes(user.id)) allStudents.push({ ...user, enrolled: true });
                    else allStudents.push({ ...user, enrolled: false });
                } else if (user.role === 'faculty') {
                    if (assignedFacultyIds.includes(user.id)) allFaculty.push({ ...user, assigned: true });
                    else allFaculty.push({ ...user, assigned: false });
                }
            });

            setEnrolledStudents(allStudents.filter(u => u.enrolled));
            setAvailableStudents(allStudents.filter(u => !u.enrolled));
            setAssignedFaculty(allFaculty.filter(u => u.assigned));
            setAvailableFaculty(allFaculty.filter(u => !u.assigned));

        } catch (error) {
            console.error("Error fetching paper details:", error);
            Alert.alert("Error", "Failed to load management data.");
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollmentChange = async (userId, userRole, action) => {
        const userRef = db.collection("users").doc(userId);
        const paperRef = db.collection("papers").doc(paperId);
        
        const paperField = userRole === 'student' ? 'studentIds' : 'facultyIds';
        const operation = action === 'add' ? arrayUnion : arrayRemove;

        try {
            // 1. Update Paper document (enroll/unenroll user)
            await paperRef.update({ [paperField]: operation(userId) });
            
            // 2. Update User document (add/remove paper from user's assigned list)
            await userRef.update({ assignedPapers: operation(paperId) });

            // Refresh the lists
            fetchPaperDetails(); 
            
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            Alert.alert('Update Failed', `Could not ${action} user.`);
        }
    };

    const renderUserItem = ({ item, isEnrolled, isStudentList }) => {
        const action = isEnrolled ? 'remove' : 'add';
        const role = isStudentList ? 'student' : 'faculty';
        
        return (
            <View style={styles.userItem}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <TouchableOpacity
                    style={isEnrolled ? styles.removeButton : styles.addButton}
                    onPress={() => handleEnrollmentChange(item.id, role, action)}
                >
                    <Text style={styles.buttonText}>{isEnrolled ? 'Remove' : 'Add'}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderList = (data, isEnrolled, isStudentList) => (
        <View style={styles.listSection}>
            <FlatList
                data={data}
                keyExtractor={item => item.id}
                renderItem={({ item }) => renderUserItem({ item, isEnrolled, isStudentList })}
                ListEmptyComponent={<Text style={styles.emptyListText}>None assigned/available.</Text>}
                style={styles.list}
            />
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Manage: {paperName}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>&times;</Text>
                    </TouchableOpacity>

                    {loading ? (
                        <ActivityIndicator size="large" color="#ec4899" style={{ padding: 50 }} />
                    ) : (
                        <ScrollView contentContainerStyle={styles.contentContainer}>
                            <View style={styles.gridContainer}>
                                {/* Students Column */}
                                <View style={styles.column}>
                                    <Text style={styles.columnHeader}>Students</Text>
                                    <Text style={styles.subHeader}>Enrolled ({enrolledStudents.length})</Text>
                                    {renderList(enrolledStudents, true, true)}
                                    <Text style={styles.subHeader}>Available ({availableStudents.length})</Text>
                                    {renderList(availableStudents, false, true)}
                                </View>

                                {/* Faculty Column */}
                                <View style={styles.column}>
                                    <Text style={styles.columnHeader}>Faculty</Text>
                                    <Text style={styles.subHeader}>Assigned ({assignedFaculty.length})</Text>
                                    {renderList(assignedFaculty, true, false)}
                                    <Text style={styles.subHeader}>Available ({availableFaculty.length})</Text>
                                    {renderList(availableFaculty, false, false)}
                                </View>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: {
        width: '95%', maxWidth: 800, backgroundColor: 'white', borderRadius: 10, padding: 20, 
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#db2777', marginBottom: 15 },
    closeButton: { position: 'absolute', top: 10, right: 15, padding: 5 },
    closeButtonText: { fontSize: 24, fontWeight: 'bold', color: '#6b7280' },
    contentContainer: { paddingBottom: 10 },
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
    column: { width: '48%', minWidth: 300, marginBottom: 15, padding: 5 },
    columnHeader: { fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 5, marginBottom: 10 },
    subHeader: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 5 },
    
    // List Item Styles
    listSection: { backgroundColor: '#f9fafb', borderRadius: 5, borderWidth: 1, borderColor: '#eee', maxHeight: 200 },
    list: { minHeight: 50 },
    userItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    userName: { fontSize: 14 },
    emptyListText: { textAlign: 'center', padding: 10, color: '#6b7280', fontStyle: 'italic' },
    
    // Action Buttons
    addButton: { backgroundColor: '#22c55e', padding: 5, borderRadius: 3 },
    removeButton: { backgroundColor: '#ef4444', padding: 5, borderRadius: 3 },
    buttonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});

export default PaperManagementModal;