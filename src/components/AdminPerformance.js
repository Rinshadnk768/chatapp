// src/components/AdminPerformance.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { db } from '../firebase/config';
import { getUserData } from '../utils/userServices';

const AdminPerformance = () => {
    const [ratings, setRatings] = useState([]);
    const [breaches, setBreaches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerformanceData = async () => {
            try {
                // --- 1. Fetch Faculty Ratings (from user docs) ---
                const facultyQuery = db.collection("users").where("role", "==", "faculty");
                const facultySnapshot = await facultyQuery.get();
                
                const fetchedRatings = facultySnapshot.docs.map(doc => {
                    const faculty = doc.data();
                    const ratingCount = faculty.ratingCount || 0;
                    const totalRating = faculty.totalRating || 0;
                    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "N/A";
                    
                    // Simple star representation logic (as in web)
                    let starsHtml = '';
                    if (ratingCount > 0) {
                        const avg = parseFloat(averageRating);
                        const fullStars = Math.floor(avg);
                        starsHtml = '★'.repeat(fullStars) + (fullStars < 5 ? '☆'.repeat(5 - fullStars) : ''); 
                    } else {
                        starsHtml = '☆☆☆☆☆';
                    }

                    return {
                        id: doc.id,
                        displayName: faculty.displayName,
                        averageRating,
                        ratingCount,
                        starsHtml,
                    };
                });
                
                // --- 2. Fetch SLA Breaches ---
                const breachQuery = db.collection("warnings").orderBy("breachedAt", "desc");
                const breachSnapshot = await breachQuery.get();

                const breachesByFaculty = {};
                for (const doc of breachSnapshot.docs) {
                    const warning = doc.data();
                    if (!breachesByFaculty[warning.facultyId]) {
                        const facultyData = await getUserData(warning.facultyId);
                        breachesByFaculty[warning.facultyId] = {
                            facultyId: warning.facultyId,
                            displayName: facultyData.displayName,
                            count: 0,
                        };
                    }
                    breachesByFaculty[warning.facultyId].count += 1;
                }
                
                setRatings(fetchedRatings);
                setBreaches(Object.values(breachesByFaculty));
                setLoading(false);

            } catch (error) {
                console.error("Error fetching performance data:", error);
                setLoading(false);
            }
        };

        fetchPerformanceData();
        // NOTE: This uses get() for simplicity, a real-time listener (onSnapshot) would be better for an active dashboard.

    }, []);

    const renderRatingItem = ({ item }) => (
        <View style={styles.listItem}>
            <Text style={styles.ratingName}>{item.displayName}</Text>
            <View style={styles.ratingDetails}>
                <Text style={styles.ratingStars}>{item.starsHtml}</Text>
                <Text style={styles.ratingScore}>{item.averageRating} ({item.ratingCount})</Text>
            </View>
        </View>
    );

    const renderBreachItem = ({ item }) => (
        <TouchableOpacity style={styles.listItem} onPress={() => Alert.alert("Breach Details", `Show detailed list of ${item.count} breaches for ${item.displayName}`)}>
            <Text style={styles.ratingName}>{item.displayName}</Text>
            <Text style={styles.breachCount}>{item.count} Delay(s) ➔</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return <ActivityIndicator size="large" color="#ec4899" style={styles.loading} />;
    }

    return (
        <View style={styles.container}>
            {/* Faculty Ratings Section */}
            <Text style={styles.sectionHeader}>Faculty Ratings</Text>
            <FlatList
                data={ratings}
                keyExtractor={(item) => item.id}
                renderItem={renderRatingItem}
                ListEmptyComponent={<Text style={styles.emptyText}>No faculty found.</Text>}
                style={styles.list}
            />

            {/* SLA Breaches Section */}
            <Text style={styles.sectionHeader}>SLA Breaches by Faculty</Text>
            <FlatList
                data={breaches}
                keyExtractor={(item) => item.facultyId}
                renderItem={renderBreachItem}
                ListEmptyComponent={<Text style={styles.emptyText}>No SLA breaches found.</Text>}
                style={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    loading: { padding: 20 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#db2777', marginTop: 15, marginBottom: 10 },
    list: { marginBottom: 15 },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        marginVertical: 4,
        borderRadius: 6,
        elevation: 2,
    },
    ratingName: { fontWeight: '700', fontSize: 16 },
    ratingDetails: { flexDirection: 'row', alignItems: 'center' },
    ratingStars: { color: '#f59e0b', fontSize: 18, marginRight: 5 },
    ratingScore: { fontSize: 14, color: '#4b5563', fontWeight: 'bold' },
    breachCount: { color: '#dc2626', fontWeight: 'bold', fontSize: 16 },
    emptyText: { textAlign: 'center', padding: 10, color: '#6b7280' },
});

export default AdminPerformance;