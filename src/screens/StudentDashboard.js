// src/screens/StudentDashboard.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { auth } from '../firebase/config';
import PapersList from '../components/PapersList';
import ConversationsList from '../components/ConversationsList'; 
import { startSupportChat } from '../utils/navigationServices'; 

const StudentDashboard = ({ navigation }) => {
    
    const handleLogout = () => {
        auth.signOut().catch(error => console.error("Logout failed:", error.message));
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Student Learning Hub</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollView}>
                
                {/* 1. Papers List Section (Your Assigned Papers) */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Your Assigned Papers</Text>
                    <PapersList />
                </View>

                {/* 2. Direct Messages (DM) Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Direct Messages</Text>
                    <ConversationsList type="dm" />
                </View>

                {/* 3. Support Channels Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Support Channels</Text>
                    <View style={styles.supportListContainer}>
                         {/* Technical Support Button */}
                         <TouchableOpacity 
                             style={styles.supportButton}
                             onPress={() => startSupportChat(navigation, 'technical_support', 'Technical Support')}
                         >
                            <Text style={styles.supportButtonText}>💬 Technical Support</Text>
                        </TouchableOpacity>
                        
                        {/* Coordinator Button */}
                        <TouchableOpacity 
                             style={styles.supportButton}
                             onPress={() => startSupportChat(navigation, 'coordinator', 'Coordinator')}
                         >
                            <Text style={styles.supportButtonText}>💬 Coordinator</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Adding extra space at the bottom for FAB clearance */}
                <View style={{ height: 100 }} />

            </ScrollView>

            {/* --- Floating Action Button (FAB) for Doubt Submission --- */}
            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => navigation.navigate('DoubtSubmission')}
                title="Ask Doubt with Screenshot"
            >
                <Text style={styles.fabText}>📸</Text>
            </TouchableOpacity>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb', // Light gray background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#db2777', // Pink color
    },
    logoutButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
    },
    logoutButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    scrollView: {
        paddingHorizontal: 8,
    },
    section: {
        marginTop: 15,
        paddingBottom: 10,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f97316', // Orange color
        marginBottom: 10,
        paddingHorizontal: 8,
    },
    
    // --- Support Button Styles ---
    supportListContainer: {
        marginHorizontal: 8,
    },
    supportButton: {
        backgroundColor: '#10b981', 
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginVertical: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    supportButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    
    // --- Floating Action Button (FAB) Styles ---
    fab: {
        position: 'absolute',
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        right: 30,
        bottom: 30,
        backgroundColor: '#ec4899', // Pink color
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fabText: {
        fontSize: 24,
        color: 'white',
    }
});

export default StudentDashboard;