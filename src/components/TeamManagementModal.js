// src/components/TeamManagementModal.js

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, FlatList } from 'react-native';
import { db } from '../firebase/config';
import firebase from '@react-native-firebase/app';
const arrayUnion = firebase.firestore.FieldValue.arrayUnion;
const arrayRemove = firebase.firestore.FieldValue.arrayRemove;

const staffRoles = ['faculty', 'technical_support', 'coordinator', 'admin'];

const TeamManagementModal = ({ isVisible, onClose, teamId, teamName }) => {
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [availableStaff, setAvailableStaff] = useState([]);

    useEffect(() => {
        if (!isVisible || !teamId) return;
        fetchTeamDetails();
    }, [isVisible, teamId]);

    const fetchTeamDetails = async () => {
        setLoading(true);
        try {
            const teamDoc = await db.collection("teams").doc(teamId).get();
            const assignedMemberIds = teamDoc.exists ? teamDoc.data().memberIds || [] : [];
            
            // Fetch all staff (Faculty, Tech Support, Coordinator, Admin)
            const staffQuery = db.collection("users").where("role", "in", staffRoles);
            const staffSnapshot = await staffQuery.get();

            let assigned = [];
            let available = [];

            staffSnapshot.forEach(doc => {
                const user = { id: doc.id, ...doc.data() };
                if (assignedMemberIds.includes(user.id)) {
                    assigned.push(user);
                } else {
                    available.push(user);
                }
            });

            setTeamMembers(assigned);
            setAvailableStaff(available);

        } catch (error) {
            console.error("Error fetching team details:", error);
            Alert.alert("Error", "Failed to load team management data.");
        } finally {
            setLoading(false);
        }
    };

    const handleMembershipChange = async (userId, action) => {
        const teamRef = db.collection("teams").doc(teamId);
        const operation = action === 'add' ? arrayUnion : arrayRemove;

        try {
            await teamRef.set({ memberIds: operation(userId) }, { merge: true });
            fetchTeamDetails(); 
        } catch (error) {
            console.error(`Error ${action}ing member:`, error);
            Alert.alert('Update Failed', `Could not ${action} member.`);
        }
    };

    const renderUserItem = ({ item, isMember }) => (
        <View style={styles.userItem}>
            <Text style={styles.userName}>{item.displayName} ({item.role})</Text>
            <TouchableOpacity
                style={isMember ? styles.removeButton : styles.addButton}
                onPress={() => handleMembershipChange(item.id, isMember ? 'remove' : 'add')}
            >
                <Text style={styles.buttonText}>{isMember ? 'Remove' : 'Add'}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderList = (data, isMember) => (
        <View style={styles.listSection}>
            <FlatList
                data={data}
                keyExtractor={item => item.id}
                renderItem={({ item }) => renderUserItem({ item, isMember })}
                ListEmptyComponent={<Text style={styles.emptyListText}>None available.</Text>}
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
                    <Text style={styles.modalTitle}>Manage: {teamName}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>&times;</Text>
                    </TouchableOpacity>

                    {loading ? (
                        <ActivityIndicator size="large" color="#ec4899" style={{ padding: 50 }} />
                    ) : (
                        <View style={styles.gridContainer}>
                            <View style={styles.column}>
                                <Text style={styles.subHeader}>Team Members ({teamMembers.length})</Text>
                                {renderList(teamMembers, true)}
                            </View>

                            <View style={styles.column}>
                                <Text style={styles.subHeader}>Available Staff ({availableStaff.length})</Text>
                                {renderList(availableStaff, false)}
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: {
        width: '95%', maxWidth: 700, backgroundColor: 'white', borderRadius: 10, padding: 20, 
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#db2777', marginBottom: 15 },
    closeButton: { position: 'absolute', top: 10, right: 15, padding: 5 },
    closeButtonText: { fontSize: 24, fontWeight: 'bold', color: '#6b7280' },
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
    column: { width: '48%', minWidth: 300, marginBottom: 15 },
    subHeader: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 5 },
    listSection: { backgroundColor: '#f9fafb', borderRadius: 5, borderWidth: 1, borderColor: '#eee', maxHeight: 300 },
    list: { minHeight: 50 },
    userItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    userName: { fontSize: 14 },
    emptyListText: { textAlign: 'center', padding: 10, color: '#6b7280', fontStyle: 'italic' },
    addButton: { backgroundColor: '#22c55e', padding: 5, borderRadius: 3 },
    removeButton: { backgroundColor: '#ef4444', padding: 5, borderRadius: 3 },
    buttonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});

export default TeamManagementModal;