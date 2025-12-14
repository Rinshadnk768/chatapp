// src/screens/FacultyDashboard.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { auth } from '../firebase/config';
import PapersList from '../components/PapersList';
import ConversationsList from '../components/ConversationsList';
import { useUserCache } from '../utils/userServices';

const FacultyDashboard = ({ navigation, userRole }) => {
    
    const handleLogout = () => {
        auth.signOut().catch(error => console.error("Logout failed:", error.message));
    };

    const isFaculty = userRole === 'faculty';
    const isSupportTeam = ['technical_support', 'coordinator'].includes(userRole);
    const teamId = isSupportTeam ? userRole : null;
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{isFaculty ? 'Faculty Panel' : 'Support Panel'}</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollView}>
                
                {/* 1. Assigned Papers Section (For Faculty Role Only) */}
                {isFaculty && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Your Assigned Papers</Text>
                        <PapersList />
                    </View>
                )}
                
                {/* 2. Support Queries Section (For Support Roles Only) */}
                {isSupportTeam && (
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Student Support Queries</Text>
                        <ConversationsList type="support" teamId={teamId} />
                    </View>
                )}

                {/* 3. Direct Messages (DM) Section (For all staff roles) */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Direct Messages</Text>
                    <ConversationsList type="dm" />
                </View>

                {/* TODO: Add bulk add students button here */}

            </ScrollView>
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
    section: { marginTop: 15, paddingBottom: 10 },
    sectionHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f97316', 
        marginBottom: 10,
        paddingHorizontal: 8,
    },
});

export default FacultyDashboard;