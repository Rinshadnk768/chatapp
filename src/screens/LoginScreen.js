// src/screens/LoginScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth } from '../firebase/config';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Login Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // Direct equivalent of the web SDK's signInWithEmailAndPassword
      await auth.signInWithEmailAndPassword(email, password);
      // Success handled by the listener in App.js
    } catch (error) {
      console.error(error);
      Alert.alert('Login Failed', error.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ... UI components (Text, TextInput, TouchableOpacity) from Phase 2 ... */}
      <Text style={styles.header}>Instil Learning Hub</Text>
      <Text style={styles.subHeader}>Login</Text>
      
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
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>LOGIN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ... Stylesheet (use React Native StyleSheet.create) ...
const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, justifyContent: 'center', backgroundColor: '#fff' },
  header: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 40, color: '#ec4899' },
  subHeader: { fontSize: 24, fontWeight: '700', color: '#db2777', marginBottom: 20 },
  input: { height: 48, borderColor: '#d1d5db', borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, marginBottom: 16, width: '100%' },
  button: { backgroundColor: '#ec4899', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  buttonText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
});

export default LoginScreen;