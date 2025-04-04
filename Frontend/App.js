import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

// Main Screens
import PatientsScreen from './screens/main/PatientsScreen';
import PatientDetailScreen from './screens/main/PatientDetailScreen';
import CalendarScreen from './screens/main/CalendarScreen';
import ChatbotScreen from './screens/main/ChatbotScreen';
import ProfileScreen from './screens/main/ProfileScreen';
import VideoPlayerScreen from './screens/main/VideoPlayerScreen';
import AddVideoScreen from './screens/main/AddVideoScreen';
import MedicationManagementScreen from './screens/main/MedicationManagementScreen';

// Theme and Config
import theme from './config/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import AddPatientScreen from './screens/main/AddPatientScreen';

import LandingScreen from './screens/LandingScreen';
import UserTypeSelectionScreen from './screens/UserTypeSelectionScreen';
import ClientAuthOptionsScreen from './screens/client/ClientAuthOptionsScreen';
import ClientLoginScreen from './screens/client/ClientLoginScreen';
import ClientRegisterScreen from './screens/client/ClientRegisterScreen';

import ClientChatbotScreen from './screens/client/ClientBot';
import { AuthProvider2, useAuth2 } from './context/ClientAuthContext';
import AppointmentScreen from './screens/client/AppointmentScreen';
import ClientProfileScreen from './screens/client/ClientProfileScreen';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Patients') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Patients" component={PatientsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const ClientTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Profile" component={ClientProfileScreen} />
      <Tab.Screen name="Appointments" component={AppointmentScreen} />
      <Tab.Screen name="Chatbot" component={ClientChatbotScreen} />
      
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="LandingScreen" component={LandingScreen} />
            <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
            <Stack.Screen name="ClientAuthOptions" component={ClientAuthOptionsScreen} />
        <Stack.Screen name="ClientLogin" component={ClientLoginScreen} />
        <Stack.Screen name="ClientRegister" component={ClientRegisterScreen} />
        
        
        <Stack.Screen name="ClientTabs" component={ClientTabs} />
           
          
        {/* Doctor Authentication Screens */}
        
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="PatientDetail" 
              component={PatientDetailScreen}
              options={{ headerShown: true, title: 'Patient Details' }}
            />
            <Stack.Screen 
              name="VideoPlayer" 
              component={VideoPlayerScreen}
              options={{ headerShown: true, title: 'Session Video' }}
            />
            <Stack.Screen 
              name="AddVideo" 
              component={AddVideoScreen}
              options={{ headerShown: true, title: 'Add New Video' }}
            />
            <Stack.Screen 
              name="AddPatient" 
              component={AddPatientScreen}
              options={{ headerShown: true, title: 'Add Patients' }}
            />

            <Stack.Screen 
              name="Medicine" 
              component={MedicationManagementScreen}
              options={{ headerShown: true, title: 'Medicine' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider2>
        <AuthProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <AppNavigator />
        </AuthProvider>
        </AuthProvider2>
      </PaperProvider>
    </SafeAreaProvider>
  );
}