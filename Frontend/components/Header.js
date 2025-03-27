import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { 
  Text, 
  Title, 
  Avatar, 
  IconButton,
  Surface
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import theme from '../config/theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

/**
 * Reusable Header component for the app
 * 
 * @param {Object} props
 * @param {string} props.title - Main title to display
 * @param {string} [props.subtitle] - Optional subtitle
 * @param {boolean} [props.showBackButton=false] - Whether to show back button
 * @param {boolean} [props.showAvatar=false] - Whether to show user avatar
 * @param {boolean} [props.gradient=true] - Whether to use gradient background
 * @param {React.ReactNode} [props.rightActions] - Optional components to render on the right side
 * @param {Object} [props.style] - Additional styles for the header container
 * @param {string} [props.statusBarColor] - Status bar background color
 * @param {string} [props.statusBarStyle='dark-content'] - Status bar content style
 */
const Header = ({ 
  title, 
  subtitle, 
  showBackButton = false,
  showAvatar = false,
  gradient = true,
  rightActions,
  style,
  statusBarColor = theme.colors.background,
  statusBarStyle = 'dark-content'
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const translateAnim = new Animated.Value(-20);
  
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
  }, []);
  
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  const handleAvatarPress = () => {
    navigation.navigate('Profile');
  };
  
  const renderContent = () => (
    <Animated.View 
      style={[
        styles.headerContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }]
        }
      ]}
    >
      <View style={styles.leftSection}>
        {showBackButton && (
          <IconButton
            icon="arrow-left"
            size={24}
            color={theme.colors.primary}
            style={styles.backButton}
            onPress={handleBackPress}
          />
        )}
        
        <View style={styles.titleContainer}>
          <Title style={styles.title}>{title}</Title>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      <View style={styles.rightSection}>
        {rightActions}
        
        {showAvatar && (
          <TouchableOpacity onPress={handleAvatarPress}>
            <Avatar.Image 
              source={{ uri: user?.profileImage || 'https://randomuser.me/api/portraits/women/76.jpg' }} 
              size={40} 
              style={styles.avatar}
              defaultSource={require('../assets/default-avatar.png')}
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
  
  return (
    <Surface style={[styles.container, style]}>
      <StatusBar 
        backgroundColor={statusBarColor} 
        barStyle={statusBarStyle} 
        translucent={false}
      />
      
      
        renderContent()
      
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
  },
  gradient: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    margin: 0,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary + '20',
    marginLeft: 8,
  },
});

export default Header;
