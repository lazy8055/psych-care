import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Image
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Title, 
  HelperText,
  Avatar,
  Divider
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../config/theme';
import { Animated } from 'react-native';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    experience: '',
    bio: '',
    clinicAddress: '',
    password: '',
    confirmPassword: '',
    profileImage: null,
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { register } = useAuth();
  
  // Animation values
  const fadeAnim = new Animated.Value(1);
  
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      updateFormData('profileImage', result.assets[0].uri);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
      if (!formData.username) newErrors.username = 'Username is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
    } else if (step === 2) {
      if (!formData.specialization) newErrors.specialization = 'Specialization is required';
      if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required';
      if (!formData.experience) newErrors.experience = 'Experience is required';
      if (!formData.clinicAddress) newErrors.clinicAddress = 'Clinic address is required';
    } else if (step === 3) {
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      // Animate transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    // Animate transition
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
    
    setCurrentStep(prev => prev - 1);
  };

  const handleRegister = async () => {
    if (validateStep(currentStep)) {
      setIsLoading(true);
      
      try {
        const result = await register(formData);
        if (result.success) {
          navigation.navigate('Login');
        } else {
          setErrors({ general: result.message });
        }
      } catch (err) {
        setErrors({ general: 'An error occurred during registration' });
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.stepContainer}>
            <View 
              style={[
                styles.stepCircle, 
                currentStep === step ? styles.activeStep : 
                currentStep > step ? styles.completedStep : {}
              ]}
            >
              {currentStep > step ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <Text style={currentStep === step ? styles.activeStepText : styles.stepText}>
                  {step}
                </Text>
              )}
            </View>
            {step < 3 && <View style={[styles.stepLine, currentStep > step ? styles.completedLine : {}]} />}
          </View>
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Animated.View style={[styles.formStep, { opacity: fadeAnim }]}>
            <Title style={styles.stepTitle}>Personal Information</Title>
            
            <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
              {formData.profileImage ? (
                <Avatar.Image 
                  source={{ uri: formData.profileImage }} 
                  size={100} 
                  style={styles.profileImage}
                />
              ) : (
                <Avatar.Icon 
                  icon="account" 
                  size={100} 
                  style={styles.profileImage}
                />
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
            
            <TextInput
              label="Full Name"
              value={formData.fullName}
              onChangeText={(text) => updateFormData('fullName', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.fullName}
              left={<TextInput.Icon name="account" />}
            />
            {errors.fullName && <HelperText type="error">{errors.fullName}</HelperText>}
            
            <TextInput
              label="Username"
              value={formData.username}
              onChangeText={(text) => updateFormData('username', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.username}
              left={<TextInput.Icon name="account-circle" />}
            />
            {errors.username && <HelperText type="error">{errors.username}</HelperText>}
            
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              left={<TextInput.Icon name="email" />}
            />
            {errors.email && <HelperText type="error">{errors.email}</HelperText>}
            
            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              error={!!errors.phone}
              left={<TextInput.Icon name="phone" />}
            />
            {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View style={[styles.formStep, { opacity: fadeAnim }]}>
            <Title style={styles.stepTitle}>Professional Details</Title>
            
            <TextInput
              label="Specialization"
              value={formData.specialization}
              onChangeText={(text) => updateFormData('specialization', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.specialization}
              left={<TextInput.Icon name="briefcase-variant" />}
            />
            {errors.specialization && <HelperText type="error">{errors.specialization}</HelperText>}
            
            <TextInput
              label="License Number"
              value={formData.licenseNumber}
              onChangeText={(text) => updateFormData('licenseNumber', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.licenseNumber}
              left={<TextInput.Icon name="certificate" />}
            />
            {errors.licenseNumber && <HelperText type="error">{errors.licenseNumber}</HelperText>}
            
            <TextInput
              label="Years of Experience"
              value={formData.experience}
              onChangeText={(text) => updateFormData('experience', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="number-pad"
              error={!!errors.experience}
              left={<TextInput.Icon name="calendar-clock" />}
            />
            {errors.experience && <HelperText type="error">{errors.experience}</HelperText>}
            
            <TextInput
              label="Bio"
              value={formData.bio}
              onChangeText={(text) => updateFormData('bio', text)}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon name="text-box" />}
            />
            
            <TextInput
              label="Clinic/Hospital Address"
              value={formData.clinicAddress}
              onChangeText={(text) => updateFormData('clinicAddress', text)}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
              error={!!errors.clinicAddress}
              left={<TextInput.Icon name="map-marker" />}
            />
            {errors.clinicAddress && <HelperText type="error">{errors.clinicAddress}</HelperText>}
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View style={[styles.formStep, { opacity: fadeAnim }]}>
            <Title style={styles.stepTitle}>Security</Title>
            
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              error={!!errors.password}
              left={<TextInput.Icon name="lock" />}
            />
            {errors.password && <HelperText type="error">{errors.password}</HelperText>}
            
            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              error={!!errors.confirmPassword}
              left={<TextInput.Icon name="lock-check" />}
            />
            {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}
            
            {errors.general && <HelperText type="error">{errors.general}</HelperText>}
            
            <Text style={styles.termsText}>
              By registering, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Create Account</Title>
        </View>
        
        {renderStepIndicator()}
        <Divider style={styles.divider} />
        
        {renderStepContent()}
        
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <Button 
              mode="outlined" 
              onPress={handlePrevStep}
              style={styles.button}
            >
              Back
            </Button>
          )}
          
          {currentStep < 3 ? (
            <Button 
              mode="contained" 
              onPress={handleNextStep}
              style={styles.button}
            >
              Next
            </Button>
          ) : (
            <Button 
              mode="contained" 
              onPress={handleRegister}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading}
            >
              Register
            </Button>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text>Already have an account? </Text>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('Login')}
            compact
          >
            Login
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activeStep: {
    backgroundColor: theme.colors.primary,
  },
  completedStep: {
    backgroundColor: theme.colors.success,
  },
  stepText: {
    color: '#757575',
    fontWeight: 'bold',
  },
  activeStepText: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepLine: {
    height: 2,
    width: 50,
    backgroundColor: '#e0e0e0',
  },
  completedLine: {
    backgroundColor: theme.colors.success,
  },
  divider: {
    marginBottom: 20,
  },
  formStep: {
    width: '100%',
  },
  stepTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
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
  input: {
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  termsText: {
    textAlign: 'center',
    marginTop: 20,
    color: theme.colors.placeholder,
  },
});

export default RegisterScreen;