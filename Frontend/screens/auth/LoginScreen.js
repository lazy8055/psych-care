import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  Dimensions
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Title, 
  Headline, 
  Subheading,
  HelperText
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { Animated } from 'react-native';
import theme from '../../config/theme';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/150' }} 
            style={styles.logo} 
          />
          <Headline style={styles.appName}>PsychCare Pro</Headline>
          <Subheading style={styles.tagline}>Professional Care Management</Subheading>
        </View>
        
        <View style={styles.formContainer}>
          <Title style={styles.title}>Login</Title>
          
          {error ? <HelperText type="error">{error}</HelperText> : null}
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            left={<TextInput.Icon name="email" />}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            mode="outlined"
            right={
              <TextInput.Icon 
                name={secureTextEntry ? "eye" : "eye-off"} 
                onPress={() => setSecureTextEntry(!secureTextEntry)} 
              />
            }
            left={<TextInput.Icon name="lock" />}
          />
          
          <Button 
            mode="contained" 
            onPress={handleLogin} 
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
          >
            Login
          </Button>
          
          <View style={styles.footer}>
            <Text>Don't have an account? </Text>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Register')}
              compact
            >
              Register
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  inner: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  appName: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  tagline: {
    color: theme.colors.placeholder,
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
});

export default LoginScreen;
