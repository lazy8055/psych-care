import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { 
  Text, 
  Title, 
  Subheading, 
  Avatar, 
  Button, 
  Card, 
  Divider,
  List,
  Dialog,
  Paragraph
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import API_ENDPOINTS from '../../config/api';
import theme from '../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ClientProfileScreen = ({ navigation }) => {
  const { user, logout, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await AsyncStorage.getItem('clienttoken');
      try {
        const response = await fetch(API_ENDPOINTS.CLIENTPROFILE, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        if (data.success) {
          console.log(data)
          setProfileData(data.user);
        } else {
          throw new Error(data.message || 'Failed to load profile');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    setShowLogoutDialog(false);
    logout();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.retryButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={120} 
            label={profileData?.full_name?.charAt(0) || 'P'} 
            style={styles.profileImage}
          />
          
          <Title style={styles.profileName}>{profileData?.name || 'Patient'}</Title>
          <Subheading style={styles.profileId}>ID: {profileData?._id}</Subheading>
        </View>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Personal Information</Title>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Age"
              description={profileData?.age}
              left={props => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
            />
            
            <List.Item
              title="Gender"
              description={profileData?.gender}
              left={props => <List.Icon {...props} icon="gender-male-female" color={theme.colors.primary} />}
            />
            
            <List.Item
              title="Contact"
              description={profileData?.contactDetails.phone}
              left={props => <List.Icon {...props} icon="phone" color={theme.colors.primary} />}
            />
            
            <List.Item
              title="Email"
              description={profileData?.contactDetails.email}
              left={props => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
            />
          </Card.Content>
        </Card>

        {/* Medical Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Medical Information</Title>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Medical History"
              description={profileData?.medicalHistory}
              descriptionNumberOfLines={4}
              left={props => <List.Icon {...props} icon="medical-bag" color={theme.colors.primary} />}
            />
          </Card.Content>
        </Card>

        {/* Doctor Information */}
        
        {/* Settings */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Settings</Title>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Change Password"
              left={props => <List.Icon {...props} icon="lock" color={theme.colors.primary} />}
              right={props => <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />}
              onPress={() => navigation.navigate('ChangePassword')}
            />
            
            <Button 
              mode="outlined" 
              onPress={() => setShowLogoutDialog(true)}
              style={styles.logoutButton}
              icon="logout"
              color={theme.colors.error}
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      {/* Logout Dialog */}
      <Dialog
        visible={showLogoutDialog}
        onDismiss={() => setShowLogoutDialog(false)}
      >
        <Dialog.Title>Logout</Dialog.Title>
        <Dialog.Content>
          <Paragraph>Are you sure you want to logout?</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowLogoutDialog(false)}>Cancel</Button>
          <Button color={theme.colors.error} onPress={handleLogout}>Logout</Button>
        </Dialog.Actions>
      </Dialog>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    backgroundColor: theme.colors.primary,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileId: {
    color: theme.colors.placeholder,
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  contactButton: {
    alignSelf: 'flex-end',
  },
  logoutButton: {
    marginTop: 16,
    borderColor: theme.colors.error,
  },
});

export default ClientProfileScreen;