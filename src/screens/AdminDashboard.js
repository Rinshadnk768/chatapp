// src/screens/AdminDashboard.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { auth } from '../firebase/config';

// --- Import Components ---
import AdminCreateUser from '../components/AdminCreateUser';
import AdminPaperManagement from '../components/AdminPaperManagement';
import AdminPerformance from '../components/AdminPerformance';
import PaperManagementModal from '../components/PaperManagementModal'; // NEW MODAL
import TeamManagementModal from '../components/TeamManagementModal';   // NEW MODAL

const AdminDashboard = ({ navigation, userRole }) => {

    // --- Modal State Management ---
    const [paperModalVisible, setPaperModalVisible] = useState(false);
    const [teamModalVisible, setTeamModalVisible] = useState(false);
    const [selectedPaper, setSelectedPaper] = useState({ id: null, name: '' });
    const [selectedTeam, setSelectedTeam] = useState({ id: null, name: '' });


    const handleLogout = () => {
        auth.signOut().catch(error => console.error("Logout failed:", error.message));
    };
    
    /**
     * Opens the Paper Management Modal and sets the selected paper data.
     */
    const openPaperManagementModal = (paperId, paperName) => {
        setSelectedPaper({ id: paperId, name: paperName });
        setPaperModalVisible(true);
    };

    /**
     * Opens the Team Management Modal and sets the selected team data.
     */
    const openTeamManagementModal = (teamId, teamName) => {
        setSelectedTeam({ id: teamId, name: teamName });
        setTeamModalVisible(true);
    };
    
    // Placeholder function for Bulk Add Students Modal
    const handleBulkAdd = () => {
        Alert.alert("Bulk Add", "Opening Bulk Add Modal (Requires a dedicated Modal component).");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{userRole === 'superadmin' ? 'Superadmin Panel' : 'Admin Panel'}</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollView}>
                <View style={styles.panelContainer}>
                    
                    {/* 1. User Management */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>User Management</Text>
                        <AdminCreateUser /> 
                        <TouchableOpacity style={styles.bulkAddButton} onPress={handleBulkAdd}>
                            <Text style={styles.bulkAddButtonText}>Bulk Add Students</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 2. Paper Management */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Paper Management</Text>
                        {/* Passes the function to trigger the management modal */}
                        <AdminPaperManagement openManagementModal={openPaperManagementModal} /> 
                    </View>

                    {/* 3. Team Management */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Team Management</Text>
                         <TouchableOpacity style={styles.teamButton} onPress={() => openTeamManagementModal('technical_support', 'Technical Support')}>
                            <Text style={styles.teamButtonText}>Manage Technical Support Team</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.teamButton} onPress={() => openTeamManagementModal('coordinator', 'Coordinator')}>
                            <Text style={styles.teamButtonText}>Manage Coordinator Team</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* 4. Faculty Performance & Breaches */}
                    <View style={styles.section}>
                        <AdminPerformance /> 
                    </View>

                    {/* 5. Superadmin Settings (Placeholder) */}
                    {userRole === 'superadmin' && (
                         <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Superadmin Settings</Text>
                            {/* TODO: Implement system configuration form */}
                            <Text style={styles.placeholderText}>[Configuration Form Placeholder]</Text>
                         </View>
                    )}
                </View>
            </ScrollView>

            {/* --- Modals Rendered Here (Control visibility via state) --- */}
            <PaperManagementModal 
                isVisible={paperModalVisible} 
                onClose={() => setPaperModalVisible(false)} 
                paperId={selectedPaper.id} 
                paperName={selectedPaper.name}
            />
            <TeamManagementModal 
                isVisible={teamModalVisible} 
                onClose={() => setTeamModalVisible(false)} 
                teamId={selectedTeam.id} 
                teamName={selectedTeam.name}
            />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#db2777' },
    logoutButton: { backgroundColor: '#dc2626', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4 },
    logoutButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
    scrollView: { paddingHorizontal: 8 },
    panelContainer: { padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8, marginVertical: 10 },
    section: { marginBottom: 20 },
    sectionHeader: { fontSize: 22, fontWeight: 'bold', color: '#f97316', marginBottom: 10 },
    placeholderText: { textAlign: 'center', padding: 10, backgroundColor: 'white', borderRadius: 6 },
    
    // Admin Button Styles
    bulkAddButton: {
        backgroundColor: '#22c55e',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 10,
    },
    bulkAddButtonText: { color: 'white', fontWeight: 'bold' },
    teamButton: {
        backgroundColor: '#6b7280',
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginVertical: 4,
    },
    teamButtonText: { color: 'white', fontWeight: 'bold' },
});

export default AdminDashboard;