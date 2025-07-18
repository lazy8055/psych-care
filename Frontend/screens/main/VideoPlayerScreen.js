import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  Linking
} from 'react-native';
import { 
  Text, 
  Title, 
  Paragraph, 
  IconButton, 
  Surface,
  Divider,
  TextInput,
  Button,
  Chip
} from 'react-native-paper';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import theme from '../../config/theme';
import API_ENDPOINTS from "../../config/api"
import { useAuth } from "../../context/AuthContext"

const { width, height } = Dimensions.get('window');

const VideoPlayerScreen = () => {
  const [status, setStatus] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportUrl, setReportUrl] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
const [insightsUrl, setInsightsUrl] = useState(null);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const route = useRoute();
  const navigation = useNavigation();
  const { session } = route.params;
  const { token } = useAuth();

  useEffect(() => {
    setNotes(session.notes?session.notes : []);
    checkExistingReport();
    checkExistingInsights();
    if (isFullscreen) StatusBar.setHidden(true);
    
    return () => {
      StatusBar.setHidden(false);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen]);
  const checkExistingInsights = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CHECK_INSIGHTS(session._id.$oid), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.exists) setInsightsUrl(data.url);
    } catch (error) {
      console.error('Insights check error:', error);
    }
  };
  const checkExistingReport = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CHECK_REPORT(session._id.$oid), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.exists) setReportUrl(data.url);
    } catch (error) {
      console.error('Report check error:', error);
    }
  };
  const generateInsights = async () => {
    try {
      setIsGeneratingInsights(true);
      const response = await fetch(API_ENDPOINTS.GENERATE_INSIGHTS(session._id.$oid), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setInsightsUrl(data.url);
        Alert.alert('Success', 'Insights generated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Insights generation failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate insights');
    } finally {
      setIsGeneratingInsights(false);
    }
  };
  

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const response = await fetch(API_ENDPOINTS.GENERATE_REPORT(session._id.$oid), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setReportUrl(data.url);
        Alert.alert('Success', 'Report generated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Report generation failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = async () => {
    if (reportUrl) {
      try {
        await Linking.openURL(reportUrl);
      } catch (error) {
        Alert.alert('Error', 'Failed to open PDF');
      }
    }
  };

  // Rest of your existing video player functions (handlePlaybackStatusUpdate, togglePlayPause, etc.)
  const renderInsightsSection = () => (
    <Surface style={styles.reportSection}>
      <Title style={styles.notesTitle}>Session Insights</Title>
      <Divider style={styles.divider} />
      
      {insightsUrl ? (
        <Button 
          mode="contained" 
          icon="chart-box" 
          onPress={() => Linking.openURL(insightsUrl)}
          style={styles.reportButton}
        >
          Download Insights
        </Button>
      ) : (
        <Button 
          mode="outlined" 
          icon="chart-areaspline" 
          onPress={generateInsights}
          loading={isGeneratingInsights}
          disabled={isGeneratingInsights}
          style={styles.reportButton}
        >
          {isGeneratingInsights ? 'Analyzing...' : 'Generate Insights'}
        </Button>
      )}
    </Surface>
  );
  const renderReportSection = () => (
    <Surface style={styles.reportSection}>
      <Title style={styles.notesTitle}>Session Report</Title>
      <Divider style={styles.divider} />
      
      {reportUrl ? (
        <Button 
          mode="contained" 
          icon="file-download" 
          onPress={handleDownloadReport}
          style={styles.reportButton}
        >
          Download Report
        </Button>
      ) : (
        <Button 
          mode="outlined" 
          icon="file-document" 
          onPress={generateReport}
          loading={isGeneratingReport}
          disabled={isGeneratingReport}
          style={styles.reportButton}
        >
          {isGeneratingReport ? 'Generating...' : 'Generate Report'}
        </Button>
      )}
    </Surface>
  );
  
  const handlePlaybackStatusUpdate = (playbackStatus) => {
    setStatus(playbackStatus);
    
    if (playbackStatus.isPlaying) {
      setCurrentTime(playbackStatus.positionMillis / 1000);
      
      // Hide controls after 3 seconds of playback
      if (showControls) {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    }
  };
  
  const togglePlayPause = () => {
    if (status.isPlaying) {
      videoRef.current.pauseAsync();
    } else {
      videoRef.current.playAsync();
    }
    
    // Reset the controls timeout
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setShowControls(true);
    
    if (!isFullscreen) {
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
  };
  
  const handleVideoPress = () => {
    setShowControls(!showControls);
  };
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    const newNote = {
      id: Date.now().toString(),
      text: note.trim(),
      timestamp: currentTime,
      createdAt: new Date().toISOString(),
    };
    try {
      console.log(session)
      const response = await fetch(API_ENDPOINTS.ADD_NOTE(session._id.$oid), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newNote),
      });
  
      const data = await response.json();
  
      if (data.success) {
        setNotes((prev) => [...prev, newNote]);
        setNote(""); // Clear input field
      } else {
        console.error("Error adding note:", data.message);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };
  
  const handleNoteTimestampClick = (timestamp) => {
    videoRef.current.setPositionAsync(timestamp * 1000);
    setShowControls(true);
  };
  
  const renderVideoPlayer = () => (
    <View style={[styles.videoContainer, isFullscreen && styles.fullscreenContainer]}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleVideoPress}
        style={styles.videoWrapper}
      >
        <Video
          ref={videoRef}
          style={[styles.video, isFullscreen && styles.fullscreenVideo]}
          source={{ uri: session.videoUrl }}
          resizeMode="contain"
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          allowsFullscreen={false}
          useNativeControls={false}
        />
        
        {/* Controls remain the same */}
        {showControls && (
          <View style={styles.controls}>
            <View style={styles.topControls}>
              <IconButton
                icon="arrow-left"
                color="white"
                size={24}
                onPress={() => {
                  if (isFullscreen) {
                    toggleFullscreen();
                  } else {
                    navigation.goBack();
                  }
                }}
              />
              <Title style={styles.videoTitle}>{session.title}</Title>
              <IconButton
                icon={isFullscreen ? "fullscreen-exit" : "fullscreen"}
                color="white"
                size={24}
                onPress={toggleFullscreen}
              />
            </View>
            
            <View style={styles.centerControls}>
              <IconButton
                icon="rewind-10"
                color="white"
                size={36}
                onPress={() => {
                  const newPosition = Math.max(0, (currentTime - 10) * 1000);
                  videoRef.current?.setPositionAsync(newPosition);
                }}
              />
              <IconButton
                icon={status.isPlaying ? "pause" : "play"}
                color="white"
                size={48}
                onPress={togglePlayPause}
              />
              <IconButton
                icon="fast-forward-10"
                color="white"
                size={36}
                onPress={() => {
                  const newPosition = Math.min(
                    status.durationMillis || 0,
                    (currentTime + 10) * 1000
                  );
                  videoRef.current?.setPositionAsync(newPosition);
                }}
              />
            </View>
            
            <View style={styles.bottomControls}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(status.durationMillis ? status.durationMillis / 1000 : 0)}
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground} />
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${status.durationMillis ? (currentTime * 1000 / status.durationMillis) * 100 : 0}%` 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
  
  const renderSessionInfo = () => (
    <Surface style={styles.infoContainer}>
      <Title style={styles.sessionTitle}>{session.title}</Title>
      <View style={styles.sessionMeta}>
        <Chip icon="calendar" style={styles.sessionChip}>{session.date}</Chip>
        <Chip icon="clock" style={styles.sessionChip}>{session.duration}</Chip>
      </View>
      <Divider style={styles.divider} />
     
    </Surface>
  );
  
  const renderNotes = () => (
    <Surface style={styles.notesContainer}>
      <Title style={styles.notesTitle}>Session Notes</Title>
      <Divider style={styles.divider} />
      
      <View style={styles.addNoteContainer}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note at current timestamp..."
          style={styles.noteInput}
          multiline
          maxHeight={80}
        />
        <Button 
          mode="contained" 
          onPress={handleAddNote}
          style={styles.addNoteButton}
          disabled={!note.trim()}
        >
          Add
        </Button>
      </View>
      console.log("Notes:", notes); // Check if notes is received correctly

      {Array.isArray(notes)&&notes.length > 0 ? (
        
        notes.sort((a, b) => a.timestamp - b.timestamp).map(noteItem => (
          <Surface key={noteItem.id} style={styles.noteItem}>
            <TouchableOpacity 
              style={styles.noteTimestamp}
              onPress={() => handleNoteTimestampClick(noteItem.timestamp)}
            >
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.noteTimestampText}>{formatTime(noteItem.timestamp)}</Text>
            </TouchableOpacity>
            <Paragraph style={styles.noteText}>{noteItem.text}</Paragraph>
          </Surface>
        ))
      ) : (
        <View style={styles.emptyNotesContainer}>
          <Ionicons name="document-text-outline" size={40} color={theme.colors.disabled} />
          <Text style={styles.emptyNotesText}>No notes added yet</Text>
        </View>
      )}
    </Surface>
  );

  if (isFullscreen) {
    return renderVideoPlayer();
  }

  return (
    <View style={styles.container}>
      {renderVideoPlayer()}
      <ScrollView style={styles.scrollContainer}>
        {renderSessionInfo()}
        {renderNotes()}
        {renderInsightsSection()}
        {renderReportSection()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    aspectRatio: undefined,
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  videoTitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 16,
  },
  timeText: {
    color: 'white',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  sessionTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sessionChip: {
    marginRight: 8,
    backgroundColor: `${theme.colors.primary}10`,
  },
  divider: {
    marginBottom: 16,
  },
  sessionNotes: {
    lineHeight: 22,
  },
  notesContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  notesTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  addNoteContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  noteInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: theme.colors.background,
  },
  addNoteButton: {
    justifyContent: 'center',
  },
  noteItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
    backgroundColor: theme.colors.background,
  },
  noteTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTimestampText: {
    marginLeft: 4,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  noteText: {
    lineHeight: 20,
  },
  emptyNotesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyNotesText: {
    marginTop: 8,
    color: theme.colors.placeholder,
  },
  reportSection: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    elevation: 2,
  },
  reportButton: {
    marginVertical: 8,
  },
});

export default VideoPlayerScreen;