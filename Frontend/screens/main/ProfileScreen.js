import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Animated,
  Alert
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
  Switch,
  Dialog,
  Paragraph,
  TextInput,
  HelperText,
  IconButton
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import theme from '../../config/theme';
import API_ENDPOINTS from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = () => {
  const { user, logout, updateProfile, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    profileImage: 'https://via.placeholder.com/300',
  });
  const [editedData, setEditedData] = useState({});
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [errors, setErrors] = useState({});
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const translateAnim = new Animated.Value(50);
  
  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
    
   
    
    // Completed
    const fetchProfile = async () => {
      try {
          
          
         
        
          // API call to get user profile
          const response = await fetch(API_ENDPOINTS.PROFILE, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfileData(data.user);
      } catch (err) {
          console.error('Error fetching profile:', err);
          setError('Failed to load profile');
      } finally {
          setLoading(false);
      }
  };

  fetchProfile();
  }, []);
  
  useEffect(() => {
    if (isEditing) {
      setEditedData({ ...profileData });
    }
  }, [isEditing]);
  
  const handleEditProfile = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!editedData.fullName) newErrors.fullName = 'Full name is required';
    if (!editedData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(editedData.email)) newErrors.email = 'Email is invalid';
    if (!editedData.phone) newErrors.phone = 'Phone number is required';
    if (!editedData.specialization) newErrors.specialization = 'Specialization is required';
    if (!editedData.licenseNumber) newErrors.licenseNumber = 'License number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    try {
        

        const response = await fetch(`${API_ENDPOINTS.PROFILE}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(editedData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update profile');
        }

        setProfileData(result.user);  // Update local state with new profile data
        setIsEditing(false);
        setErrors({});

        Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    }
};

  
  const handleLogout = () => {
    setShowLogoutDialog(false);
    logout();
  };
  
  const pickImage = async () => {
    if (!isEditing) return;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to change your profile picture.');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setEditedData(prev => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };
  
  const updateField = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const renderProfileHeader = () => (
    <Animated.View 
      style={[
        styles.profileHeader,
        {
          
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.profileImageContainer} 
        onPress={pickImage}
        disabled={!isEditing}
      >
        <Avatar.Image 
          source={{ uri: isEditing ? editedData.profileImage : profileData.profileImage }} 
          size={120} 
          style={styles.profileImage}
        />
        {isEditing && (
          <View style={styles.editIconContainer}>
            <Ionicons name="camera" size={20} color="white" />
          </View>
        )}
      </TouchableOpacity>
      
      {isEditing ? (
        <TextInput
          label="Full Name"
          value={editedData.fullName}
          onChangeText={(text) => updateField('fullName', text)}
          style={styles.nameInput}
          mode="outlined"
          error={!!errors.fullName}
        />
      ) : (
        <Title style={styles.profileName}>{profileData.fullName}</Title>
      )}
      
      {isEditing ? (
        <TextInput
          label="Specialization"
          value={editedData.specialization}
          onChangeText={(text) => updateField('specialization', text)}
          style={styles.specializationInput}
          mode="outlined"
          error={!!errors.specialization}
        />
      ) : (
        <Subheading style={styles.profileSpecialization}>{profileData.specialization}</Subheading>
      )}
      
      {!isEditing && (
        <View style={styles.profileActions}>
          <Button 
            mode="contained" 
            onPress={handleEditProfile}
            style={styles.editButton}
            icon="account-edit"
          >
            Edit Profile
          </Button>
        </View>
      )}
    </Animated.View>
  );
  
  const renderProfileInfo = () => (
    <Card style={styles.infoCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Personal Information</Title>
        <Divider style={styles.divider} />
        
        {isEditing ? (
          <View>
            <TextInput
              label="Username"
              value={editedData.username}
              onChangeText={(text) => updateField('username', text)}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon name="account" />}
            />
            
            <TextInput
              label="Email"
              value={editedData.email}
              onChangeText={(text) => updateField('email', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              error={!!errors.email}
              left={<TextInput.Icon name="email" />}
            />
            {errors.email && <HelperText type="error">{errors.email}</HelperText>}
            
            <TextInput
              label="Phone Number"
              value={editedData.phone}
              onChangeText={(text) => updateField('phone', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              error={!!errors.phone}
              left={<TextInput.Icon name="phone" />}
            />
            {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
          </View>
        ) : (
          <View>
            <List.Item
              title="Username"
              description={profileData.username}
              left={props => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
            />
            
            <List.Item
              title="Email"
              description={profileData.email}
              left={props => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
              right={props => (
                <IconButton
                  {...props}
                  icon="content-copy"
                  onPress={() => {
                    // In a real app, you would use Clipboard.setString(profileData.email)
                    Alert.alert('Copied', 'Email copied to clipboard');
                  }}
                  color={theme.colors.primary}
                />
              )}
            />
            
            <List.Item
              title="Phone"
              description={profileData.phone}
              left={props => <List.Icon {...props} icon="phone" color={theme.colors.primary} />}
              right={props => (
                <IconButton
                  {...props}
                  icon="content-copy"
                  onPress={() => {
                    // In a real app, you would use Clipboard.setString(profileData.phone)
                    Alert.alert('Copied', 'Phone number copied to clipboard');
                  }}
                  color={theme.colors.primary}
                />
              )}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderProfessionalInfo = () => (
    <Card style={styles.infoCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Professional Information</Title>
        <Divider style={styles.divider} />
        
        {isEditing ? (
          <View>
            <TextInput
              label="License Number"
              value={editedData.licenseNumber}
              onChangeText={(text) => updateField('licenseNumber', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.licenseNumber}
              left={<TextInput.Icon name="certificate" />}
            />
            {errors.licenseNumber && <HelperText type="error">{errors.licenseNumber}</HelperText>}
            
            <TextInput
              label="Years of Experience"
              value={editedData.experience}
              onChangeText={(text) => updateField('experience', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="number-pad"
              left={<TextInput.Icon name="calendar-clock" />}
            />
            
            <TextInput
              label="Bio"
              value={editedData.bio}
              onChangeText={(text) => updateField('bio', text)}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              left={<TextInput.Icon name="text-box" />}
            />
            
            <TextInput
              label="Clinic/Hospital Address"
              value={editedData.clinicAddress}
              onChangeText={(text) => updateField('clinicAddress', text)}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
              left={<TextInput.Icon name="map-marker" />}
            />
          </View>
        ) : (
          <View>
            <List.Item
              title="License Number"
              description={profileData.licenseNumber}
              left={props => <List.Icon {...props} icon="certificate" color={theme.colors.primary} />}
            />
            
            <List.Item
              title="Experience"
              description={profileData.experience}
              left={props => <List.Icon {...props} icon="calendar-clock" color={theme.colors.primary} />}
            />
            
            <List.Item
              title="Bio"
              description={profileData.bio}
              descriptionNumberOfLines={3}
              descriptionStyle={styles.bioText}
              left={props => <List.Icon {...props} icon="text-box" color={theme.colors.primary} />}
            />
            
            <List.Item
              title="Clinic Address"
              description={profileData.clinicAddress}
              descriptionNumberOfLines={2}
              left={props => <List.Icon {...props} icon="map-marker" color={theme.colors.primary} />}
              right={props => (
                <IconButton
                  {...props}
                  icon="map"
                  onPress={() => {
                    // In a real app, you would open maps app
                    Alert.alert('Map', 'Opening maps app with clinic location');
                  }}
                  color={theme.colors.primary}
                />
              )}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderSettings = () => (
    <Card style={styles.infoCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Settings</Title>
        <Divider style={styles.divider} />
        
        <List.Item
          title="Dark Mode"
          left={props => <List.Icon {...props} icon="theme-light-dark" color={theme.colors.primary} />}
          right={() => (
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Notifications"
          left={props => <List.Icon {...props} icon="bell" color={theme.colors.primary} />}
          right={() => (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Change Password"
          left={props => <List.Icon {...props} icon="lock" color={theme.colors.primary} />}
          right={props => (
            <IconButton
              {...props}
              icon="chevron-right"
              onPress={() => {
                // In a real app, you would navigate to change password screen
                Alert.alert('Change Password', 'Navigate to change password screen');
              }}
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Privacy Policy"
          left={props => <List.Icon {...props} icon="shield" color={theme.colors.primary} />}
          right={props => (
            <IconButton
              {...props}
              icon="chevron-right"
              onPress={() => {
                // In a real app, you would navigate to privacy policy screen
                Alert.alert('Privacy Policy', 'Navigate to privacy policy screen');
              }}
              color={theme.colors.primary}
            />
          )}
        />
        
        <List.Item
          title="Terms of Service"
          left={props => <List.Icon {...props} icon="file-document" color={theme.colors.primary} />}
          right={props => (
            <IconButton
              {...props}
              icon="chevron-right"
              onPress={() => {
                // In a real app, you would navigate to terms of service screen
                Alert.alert('Terms of Service', 'Navigate to terms of service screen');
              }}
              color={theme.colors.primary}
            />
          )}
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
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderProfileHeader()}
        
        {isEditing && (
          <View style={styles.editActions}>
            <Button 
              mode="outlined" 
              onPress={handleCancelEdit}
              style={[styles.actionButton, styles.cancelButton]}
              icon="close"
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveProfile}
              style={[styles.actionButton, styles.saveButton]}
              icon="content-save"
            >
              Save
            </Button>
          </View>
        )}
        
        {renderProfileInfo()}
        {renderProfessionalInfo()}
        {renderSettings()}
      </ScrollView>
      
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    backgroundColor: theme.colors.primary,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileSpecialization: {
    color: theme.colors.placeholder,
    marginBottom: 16,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editButton: {
    minWidth: 150,
  },
  nameInput: {
    width: '80%',
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  specializationInput: {
    width: '80%',
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    borderColor: theme.colors.placeholder,
  },
  saveButton: {
    backgroundColor: theme.colors.success,
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
  input: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  bioText: {
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 16,
    borderColor: theme.colors.error,
  },
});

export default ProfileScreen;