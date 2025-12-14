// src/components/AdminCreateUser.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Picker } from 'react-native';
import { functions } from '../firebase/config'; // Import the functions service

const AdminCreateUser = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);

    // Matches the staff roles defined in your HTML
    const roles = [
        { label: 'Student', value: 'student' },
        { label: 'Faculty', value: 'faculty' },
        { label: 'Technical Support', value: 'technical_support' },
        { label: 'Coordinator', value: 'coordinator' },
        { label: 'Admin', value: 'admin' },
    ];

    const handleCreateUser = async () => {
        if (!email || !password || !displayName) {
            return Alert.alert('Validation Error', 'Please fill all fields: Email, Password, and Full Name.');
        }

        setLoading(true);

        try {
            // Equivalent to httpsCallable(functions, 'createUser')
            const createUserFn = functions.httpsCallable('createUser');
            
            const result = await createUserFn({ 
                email, 
                password, 
                displayName, 
                role 
            });

            // The result structure matches what your Cloud Function returns
            Alert.alert('Success', result.data.message);
            
            // Reset the form after success (Equivalent to form.reset() in web)
            setEmail('');
            setPassword('');
            setDisplayName('');
            setRole('student');

        } catch (error) {
            console.error("Error calling createUser:", error);
            // Cloud functions errors are often wrapped, extract the details if possible
            const errorMessage = error.message || "An unknown error occurred during creation.";
            Alert.alert('Creation Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Create New User</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            
            <TextInput
                style={styles.input}
                placeholder="Temporary Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            
            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={displayName}
                onChangeText={setDisplayName}
            />
            
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={role}
                    style={styles.picker}
                    onValueChange={(itemValue) => setRole(itemValue)}
                >
                    {roles.map(r => (
                        <Picker.Item key={r.value} label={r.label} value={r.value} />
                    ))}
                </Picker>
            </View>

            <TouchableOpacity 
                style={styles.button} 
                onPress={handleCreateUser}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>CREATE USER</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        marginBottom: 20,
    },
    header: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        paddingBottom: 8,
    },
    input: {
        height: 48,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 12,
        marginBottom: 12,
        backgroundColor: 'white',
    },
    pickerContainer: {
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 6,
        marginBottom: 12,
        backgroundColor: 'white',
    },
    picker: {
        height: 48,
        width: '100%',
    },
    button: {
        backgroundColor: '#ec4899', // Matches btn-primary gradient start color
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default AdminCreateUser;