import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { 
  Text, 
  Title, 
  TextInput, 
  Button, 
  Surface,
  HelperText,
  Divider,
  ActivityIndicator,
  Chip
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import theme from '../../config/theme';
import API_ENDPOINTS from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const AddVideoScreen = () => {
  const [videoData, setVideoData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    notes: '',
    videoUri: null,
    thumbnailUri: null,
  });
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const route = useRoute();
  const navigation = useNavigation();
  const { patientId } = route.params;
  const { token } = useAuth();
  
  useEffect(() => {
    requestPermissions();
  }, []);
  
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (libraryStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need media library permissions to upload videos and images.'
        );
      }
    }
  };
  
  const updateField = (field, value) => {
    setVideoData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!videoData.title) newErrors.title = 'Title is required';
    if (!videoData.date) newErrors.date = 'Date is required';
    if (!videoData.duration) newErrors.duration = 'Duration is required';
    if (!videoData.videoUri) newErrors.video = 'Video is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled) {
        updateField('videoUri', result.assets[0].uri);
        
        // Generate a thumbnail from the video (in a real app)
        // For demo, we'll use a placeholder
        updateField('thumbnailUri', 'https://via.placeholder.com/300x200');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };
  
  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        updateField('thumbnailUri', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking thumbnail:', error);
      Alert.alert('Error', 'Failed to select thumbnail. Please try again.');
    }
  };
  
  const handleUpload = async () => {
    if (!validateForm()) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 500);
      
      // In a real app, you would upload the video to your server
       const formData = new FormData();
       formData.append('patientId', patientId);
       formData.append('title', videoData.title);
       formData.append('date', videoData.date);
       formData.append('duration', videoData.duration);
       formData.append('notes', videoData.notes);
       formData.append('video', {
         uri: videoData.videoUri,
         name: 'video.mp4',
         type: 'video/mp4',
       });
   if (videoData.thumbnailUri) {
         formData.append('thumbnail', {
           uri: videoData.thumbnailUri,
           name: 'thumbnail.jpg',
           type: 'image/jpeg',
         });
       }
      
       const response = await fetch(API_ENDPOINTS.UPLOAD_VIDEO(patientId), {
         method: 'POST',
         headers: {

           'Authorization': `Bearer ${token}`,
         },
         body: formData,
       });
      
       const data = await response.json();
      
      // Simulate network delay
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        setTimeout(() => {
          setIsUploading(false);
          Alert.alert(
            'Success',
            'Video uploaded successfully',
            [
              { 
                text: 'OK', 
                onPress: () => navigation.goBack() 
              }
            ]
          );
        }, 500);
      }, 5000);
      console.log("temp");
    } catch (error) {
      console.error('Error uploading video:', error);
      setIsUploading(false);
      Alert.alert('Error', 'Failed to upload video. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={styles.screenTitle}>Add Session Video</Title>
        
        <Surface style={styles.formContainer}>
          <TextInput
            label="Session Title"
            value={videoData.title}
            onChangeText={(text) => updateField('title', text)}
            style={styles.input}
            mode="outlined"
            error={!!errors.title}
          />
          {errors.title && <HelperText type="error">{errors.title}</HelperText>}
          
          <TextInput
            label="Session Date"
            value={videoData.date}
            onChangeText={(text) => updateField('date', text)}
            style={styles.input}
            mode="outlined"
            error={!!errors.date}
            placeholder="YYYY-MM-DD"
          />
          {errors.date && <HelperText type="error">{errors.date}</HelperText>}
          
          <TextInput
            label="Session Duration"
            value={videoData.duration}
            onChangeText={(text) => updateField('duration', text)}
            style={styles.input}
            mode="outlined"
            error={!!errors.duration}
            placeholder="e.g., 50 minutes"
          />
          {errors.duration && <HelperText type="error">{errors.duration}</HelperText>}
          
          <TextInput
            label="Session Notes"
            value={videoData.notes}
            onChangeText={(text) => updateField('notes', text)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
          
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>Video</Title>
          
          <TouchableOpacity 
            style={[
              styles.uploadContainer,
              videoData.videoUri ? styles.uploadContainerWithPreview : {},
              errors.video ? styles.uploadContainerError : {}
            ]}
            onPress={pickVideo}
            disabled={isUploading}
          >
            {videoData.videoUri ? (
              <View style={styles.videoPreviewContainer}>
                <Image 
                  source={{ uri: videoData.thumbnailUri || 'https://via.placeholder.com/300x200' }} 
                  style={styles.videoThumbnail} 
                />
                <View style={styles.videoInfoOverlay}>
                  <Ionicons name="videocam" size={24} color="white" />
                  <Text style={styles.videoSelectedText}>Video selected</Text>
                  <Chip icon="check" style={styles.videoSelectedChip}>Change</Chip>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPrompt}>
                <Ionicons name="cloud-upload" size={40} color={theme.colors.primary} />
                <Text style={styles.uploadText}>Tap to select a video</Text>
                <Text style={styles.uploadSubtext}>MP4, MOV, or AVI format</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.video && <HelperText type="error">{errors.video}</HelperText>}
          
          {videoData.videoUri && (
            <>
              <Title style={styles.sectionTitle}>Thumbnail</Title>
              
              <TouchableOpacity 
                style={styles.thumbnailContainer}
                onPress={pickThumbnail}
                disabled={isUploading}
              >
                {videoData.thumbnailUri ? (
                  <Image 
                    source={{ uri: videoData.thumbnailUri }} 
                    style={styles.thumbnailPreview} 
                  />
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <Ionicons name="image" size={30} color={theme.colors.primary} />
                    <Text style={styles.thumbnailText}>Add custom thumbnail</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </Surface>
        
        {isUploading ? (
          <Surface style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.uploadingText}>Uploading video...</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${uploadProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </Surface>
        ) : (
          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleUpload}
              style={styles.uploadButton}
              icon="cloud-upload"
            >
              Upload
            </Button>
          </View>
        )}
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
    padding: 16,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary + '50',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: theme.colors.primary + '10',
    overflow: 'hidden',
  },
  uploadContainerWithPreview: {
    borderStyle: 'solid',
    borderColor: theme.colors.primary,
  },
  uploadContainerError: {
    borderColor: theme.colors.error,
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  uploadSubtext: {
    marginTop: 4,
    color: theme.colors.placeholder,
  },
  videoPreviewContainer: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoInfoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoSelectedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  videoSelectedChip: {
    backgroundColor: theme.colors.primary,
  },
  thumbnailContainer: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  thumbnailText: {
    marginTop: 8,
    color: theme.colors.primary,
  },
  uploadingContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  uploadingText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.disabled + '50',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    color: theme.colors.placeholder,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  uploadButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
  },
});

export default AddVideoScreen;