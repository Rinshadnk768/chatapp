// App.js

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { auth, db } from './src/firebase/config';

// Import all Screen Components
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import StudentDashboard from './src/screens/StudentDashboard';
import FacultyDashboard from './src/screens/FacultyDashboard';
import DoubtSubmissionScreen from './src/screens/DoubtSubmissionScreen'; // <-- FINAL INTEGRATION
import StudentMyDoubtsScreen from './src/screens/StudentMyDoubtsScreen'; // <-- FINAL INTEGRATION

// Import Utilities and Hooks
import { usePresenceTracker } from './src/hooks/usePresenceTracker'; // Global RTDB Listener
import { useUserCache } from './src/utils/userServices'; // Used to get user role

const Stack = createStackNavigator();

/**
 * Custom Hook to subscribe to the current user's role from Firestore.
 */
const useUserRole = (user) => {
  const [role, setRole] = useState(null);
  
  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }
    
    // Listen for the user document (role is stored here)
    const userRef = db.collection('users').doc(user.uid);
    
    const unsubscribe = userRef.onSnapshot(docSnapshot => {
      if (docSnapshot.exists) {
        setRole(docSnapshot.data()?.role || 'student');
      } else {
        // Handle case where user document doesn't exist yet (e.g., new auth user before database write)
        setRole('student'); 
      }
    });

    return () => unsubscribe();
  }, [user]);

  return role;
}

/**
 * Component that decides which dashboard to render based on userRole.
 */
const RoleBasedSwitch = ({ navigation, userRole }) => {
    
    // If userRole is still null (loading), show a simple indicator
    if (!userRole) {
        return <ActivityIndicator size="large" color="#ec4899" style={styles.loading} />;
    }
    
    switch (userRole) {
        case 'admin':
        case 'superadmin':
            // Renders the Admin dashboard content
            return <AdminDashboard navigation={navigation} userRole={userRole} />;
            
        case 'faculty':
        case 'technical_support':
        case 'coordinator':
            // Renders the Faculty/Staff dashboard content
            return <FacultyDashboard navigation={navigation} userRole={userRole} />;
            
        case 'student':
        default:
            // Default to Student dashboard
            return <StudentDashboard navigation={navigation} userRole={userRole} />;
    }
};


export default function App() {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    
    // 1. Run the hook to initialize presence tracking globally
    usePresenceTracker(); 

    // 2. Fetch the user's role (will be null if not logged in)
    const userRole = useUserRole(user);

    // Auth State Listener (onAuthStateChanged equivalent)
    useEffect(() => {
        const subscriber = auth.onAuthStateChanged(currentUser => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return subscriber; // unsubscribe on unmount
    }, []);

    // Show loading screen while Firebase Auth state is initializing
    if (loadingAuth) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#ec4899" />
            </View>
        );
    }
    
    // Check if the user is authenticated AND the role has been fetched (to avoid flashing the wrong dashboard)
    const isAuthReady = user ? userRole !== null : true;
    
    if (!isAuthReady) {
         return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#ec4899" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: '#db2777' }, // Theme Pink Header
                    headerTintColor: '#fff', // White text
                }}
            >
                {user ? (
                    // Screens visible only when authenticated
                    <>
                        <Stack.Screen 
                            name="DashboardRouter" 
                            // The component to render is the RoleBasedSwitch
                            component={props => <RoleBasedSwitch {...props} userRole={userRole} />} 
                            options={{ headerShown: false }} // Hiding the header as the dashboards have their own header/logout button
                        />
                        <Stack.Screen 
                            name="Chat" 
                            component={ChatScreen} 
                            options={({ route }) => ({ 
                                title: route.params?.chatTitle || 'Chat',
                                headerBackTitleVisible: false, // Cleaner UX
                            })} 
                        />
                        <Stack.Screen // <-- INTEGRATION 1: Doubt Submission Modal
                            name="DoubtSubmission"
                            component={DoubtSubmissionScreen}
                            options={{ title: 'Ask a Doubt', presentation: 'modal' }} 
                        />
                         <Stack.Screen // <-- INTEGRATION 2: Student Doubts List
                            name="MyDoubts"
                            component={StudentMyDoubtsScreen}
                            options={{ title: 'My Submitted Doubts' }} 
                        />
                    </>
                ) : (
                    // Screen visible when logged out
                    <Stack.Screen 
                        name="Login" 
                        component={LoginScreen} 
                        options={{ title: 'Instil Learning Hub', headerShown: false }} // Hiding header for login screen
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    }
});