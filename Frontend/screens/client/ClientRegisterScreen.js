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
import { useAuth2 } from '../../context/ClientAuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../config/theme';
import { Animated } from 'react-native';
import API_ENDPOINTS from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ClientRegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const register = async (userData) => {
      try {
        const response = await fetch(API_ENDPOINTS.CLIENTREGISTER, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          return { success: true };
        } else {
          return { success: false, message: data.message || 'Registration failed' };
        }
      } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Network error' };
      }
    };
  
  
  
  // Animation values
  const fadeAnim = new Animated.Value(1);
  
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

   

  const validateStep = () => {
    const newErrors = {};
    
   
      if (!formData.id) newErrors.id = 'Id is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
     
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  

  const handleRegister = async () => {
    if (validateStep()) {
      setIsLoading(true);
      
      try {
        const result = await register(formData);
        if (result.success) {
          navigation.navigate('ClientLogin');
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

   

  const renderStepContent = () => {
    
        return (
          <Animated.View style={[styles.formStep, { opacity: fadeAnim }]}>
            <Title style={styles.stepTitle}>Register</Title>
            
            
            <TextInput
              label="Id"
              value={formData.id}
              onChangeText={(text) => updateFormData('id', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.id}
              left={<TextInput.Icon name="account" />}
            />
            {errors.id && <HelperText type="error">{errors.id}</HelperText>}
           
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              style={styles.input}
              mode="outlined"
              error={!!errors.email}
              left={<TextInput.Icon name="email" />}
            />
            {errors.email && <HelperText type="error">{errors.email}</HelperText>}
            
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
        
       
        <Divider style={styles.divider} />
        
        {renderStepContent()}
        
        <View style={styles.buttonContainer}>
          {
            <Button 
              mode="contained" 
              onPress={handleRegister}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading}
            >
              Register
            </Button>
          }
        </View>
        
        <View style={styles.footer}>
          <Text>Already have an account? </Text>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('ClientLogin')}
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

export default ClientRegisterScreen;