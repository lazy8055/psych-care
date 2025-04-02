"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { View, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, Linking } from "react-native"
import {
  Text,
  Title,
  Card,
  Divider,
  Button,
  Chip,
  List,
  ActivityIndicator,
  FAB,
  Portal,
  Dialog,
  Paragraph,
  IconButton,
} from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import theme from "../../config/theme"
import { useAuth } from "../../context/AuthContext"
import API_ENDPOINTS from "../../config/api"
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window")

const PatientDetailScreen = () => {
 
  const [sessionsArray, setSession] = useState(null)
  const [patient, setPatient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("info") // 'info' or 'sessions'
  const [fabOpen, setFabOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const navigation = useNavigation()
  const route = useRoute()
  const { patientId } = route.params
  const { token } = useAuth()

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current
  const headerHeight = 30
  const headerFade = scrollY.interpolate({
    inputRange: [0, headerHeight*2],
    outputRange: [1, 0],
    extrapolate: "clamp",
  })

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -headerHeight],
    extrapolate: "clamp",
  })

  const contentTranslate = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [headerHeight, headerHeight],
    extrapolate: "clamp",
  })

  useEffect(() => {
    fetchPatientDetails()
  }, [patientId])

  useFocusEffect(
    useCallback(() => {
      fetchPatientDetails() // Reload patient data on every visit
    }, [patientId])
  );

  const fetchPatientDetails = async () => {
    setIsLoading(true)
    setError(null)
    console.log(API_ENDPOINTS.UPLOAD_VIDEO(patientId));

    try {
      // In a real app, you would fetch from your API
       const response = await fetch(API_ENDPOINTS.PATIENT_DETAIL(patientId), {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
         }
       });
       const data = await response.json();

      // For demo purposes, using mock data
      const mockPatient = {
        id: patientId,
        name: "John Doe",
        age: 35,
        gender: "Male",
        image: "https://randomuser.me/api/portraits/men/32.jpg",
        status: "Current",
        contactDetails: {
          phone: "+1 (555) 123-4567",
          email: "john.doe@example.com",
        },
        address: "123 Main Street, Apt 4B, New York, NY 10001",
        medicalHistory:
          "Patient has a history of generalized anxiety disorder since 2018. No significant medical conditions. No allergies reported.",
        familyHistory:
          "Father diagnosed with depression at age 45. Mother has no reported mental health conditions. Younger sister (28) diagnosed with anxiety.",
        presentingProblem:
          "Patient reports increasing anxiety over the past 6 months, particularly in social and work situations. Experiencing panic attacks approximately twice weekly.",
        clinicalObservations:
          "Patient presents as well-groomed but visibly tense. Speech is rapid at times. Mood appears anxious with congruent affect. No evidence of thought disorder or perceptual disturbances.",
        assessment:
          "Generalized Anxiety Disorder (GAD) with panic features. Rule out Social Anxiety Disorder. GAD-7 score: 16 (severe anxiety).",
        treatmentPlan:
          "Weekly cognitive-behavioral therapy sessions for 12 weeks. Progressive muscle relaxation and mindfulness training. Consider medication if symptoms do not improve within 4 weeks.",
        medications:
          "Currently not on medication. Previously tried Sertraline 50mg daily (discontinued due to side effects).",
        lifestyle:
          "Works as software engineer (high stress). Exercise: occasional walking. Sleep: reports difficulty falling asleep. Diet: regular meals but high caffeine intake.",
        emergencyContact: {
          name: "Jane Doe (Wife)",
          phone: "+1 (555) 987-6543",
          relationship: "Spouse",
        },
        sessions: [
          {
            id: "s1",
            date: "2023-05-15",
            title: "Initial Assessment",
            duration: "50 minutes",
            notes:
              "Completed initial assessment. Patient described onset of anxiety symptoms following job change 6 months ago. Established therapeutic goals.",
            videoUrl: "https://example.com/sessions/video1",
            thumbnailUrl: "https://picsum.photos/seed/session1/300/200",
          },
          {
            id: "s2",
            date: "2023-05-22",
            title: "CBT Session 1",
            duration: "45 minutes",
            notes:
              "Introduced CBT model. Identified cognitive distortions including catastrophizing and black-and-white thinking. Assigned thought record homework.",
            videoUrl: "https://example.com/sessions/video2",
            thumbnailUrl: "https://picsum.photos/seed/session2/300/200",
          },
          {
            id: "s3",
            date: "2023-05-29",
            title: "CBT Session 2",
            duration: "50 minutes",
            notes:
              "Reviewed thought records. Patient showing good insight into anxiety triggers. Practiced progressive muscle relaxation technique in session.",
            videoUrl: "https://example.com/sessions/video3",
            thumbnailUrl: "https://picsum.photos/seed/session3/300/200",
          },
        ],
        documents: [
          {
            id: "d1",
            title: "Informed Consent",
            date: "2023-05-15",
            fileUrl: "https://example.com/documents/consent.pdf",
          },
          {
            id: "d2",
            title: "Release of Information",
            date: "2023-05-15",
            fileUrl: "https://example.com/documents/release.pdf",
          },
        ],
      }
      console.log(data)
      // Simulate network delay
      
      
      setTimeout(() => {
        setPatient(data.patient);
        setIsLoading(false);
      
        setTimeout(() => {
          setSession(data.patient.sessions);  // Use `data.patient`, not `patient`
        }, 1000);
      
      }, 1000);
      
      
    } catch (err) {
      console.error("Error fetching patient details:", err)
      setError("Failed to load patient details. Please try again.")
      setIsLoading(false)
    }
  }

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`)
  }

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`)
  }

  const handleVideoPress = (session) => {
   navigation.navigate("VideoPlayer", { session })
  }

  const handleAddVideo = () => {
    setFabOpen(false)
    navigation.navigate("AddVideo", { patientId })
  }

  const handleDeletePatient = () => {
    setShowDeleteDialog(false)
    // In a real app, you would call your API to delete the patient
    // Then navigate back
    navigation.goBack()
  }

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Contact Information</Title>
          <Divider style={styles.divider} />

          <View style={styles.contactRow}>
            <Ionicons name="call" size={20} color={theme.colors.primary} />
            <Text style={styles.contactText}>{patient.contactDetails.phone}</Text>
            <TouchableOpacity style={styles.contactButton} onPress={() => handleCall(patient.contactDetails.phone)}>
              <Ionicons name="call-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="mail" size={20} color={theme.colors.primary} />
            <Text style={styles.contactText}>{patient.contactDetails.email}</Text>
            <TouchableOpacity style={styles.contactButton} onPress={() => handleEmail(patient.contactDetails.email)}>
              <Ionicons name="mail-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="location" size={20} color={theme.colors.primary} />
            <Text style={styles.contactText}>{patient.address}</Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${patient.address}`)}
            >
              <Ionicons name="navigate-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Medical History</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.sectionText}>{patient.medicalHistory}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Family History</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.sectionText}>{patient.familyHistory}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Presenting Problem</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.sectionText}>{patient.presentingProblem}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Clinical Observations</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.sectionText}>{patient.clinicalObservations}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Assessment & Diagnosis</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.sectionText}>{patient.assessment}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Treatment Plan</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.sectionText}>{patient.treatmentPlan}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Medications & Referrals</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.sectionText}>{patient.medications}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Lifestyle & Habits</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.sectionText}>{patient.lifestyle}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Emergency Contact</Title>
          <Divider style={styles.divider} />

          <View style={styles.contactRow}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
            <Text style={styles.contactText}>
              {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
            </Text>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="call" size={20} color={theme.colors.primary} />
            <Text style={styles.contactText}>{patient.emergencyContact.phone}</Text>
            <TouchableOpacity style={styles.contactButton} onPress={() => handleCall(patient.emergencyContact.phone)}>
              <Ionicons name="call-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Consent & Legal Documents</Title>
          <Divider style={styles.divider} />

          {patient.documents.map((doc) => (
            <List.Item
              key={doc.id}
              title={doc.title}
              description={`Added on ${doc.date}`}
              left={(props) => <List.Icon {...props} icon="file-document-outline" color={theme.colors.primary} />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="eye"
                  onPress={() => Linking.openURL(doc.fileUrl)}
                  color={theme.colors.primary}
                />
              )}
              style={styles.documentItem}
            />
          ))}

          <Button
            mode="outlined"
            icon="plus"
            style={styles.addDocumentButton}
            onPress={() => console.log("Add document")}
          >
            Add Document
          </Button>
        </Card.Content>
      </Card>
    </View>
  )

  const renderSessionsTab = () => (
<View style={styles.tabContent}>
    <Title style={styles.sessionsTitle}>Session Videos</Title>

    {sessionsArray.length === 0 ? (
      <Text style={styles.noSessionText}>No sessions available</Text>
    ) : (
      sessionsArray.map((session) => (
        <Card key={session.id} style={styles.sessionCard} onPress={() => handleVideoPress(session)}>
          <Card.Cover source={{ uri: session.thumbnailUrl }} style={styles.sessionThumbnail} />
          <View style={styles.playIconContainer}>
            <Ionicons name="play-circle" size={50} color="white" />
          </View>
          <Card.Content style={styles.sessionContent}>
            <Title style={styles.sessionTitle}>{session.title}</Title>
            <View style={styles.sessionMeta}>
              <Chip icon="calendar" style={styles.sessionChip}>
                {new Date(session.date.$date).toLocaleString()}
              </Chip>
              <Chip icon="clock" style={styles.sessionChip}>
                {session.duration}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      ))
    )}
  </View>
  )
// <Paragraph style={styles.sessionNotes}>{session.notes}</Paragraph>
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading patient details...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchPatientDetails} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            
          },
        ]}
      >
        <Image
          source={{ uri: patient.image }}
          style={styles.coverImage}
          defaultSource={require("../../assets/default-avatar.png")}
        />
      <View style={styles.headerOverlay} />
        <View style={styles.patientInfoHeader}>
          <Title style={styles.patientName}>{patient.name}</Title>
          <View style={styles.patientMetaContainer}>
            <Chip icon="calendar" style={styles.patientMetaChip}>
              {patient.age} years
            </Chip>
            <Chip icon="gender-male-female" style={styles.patientMetaChip}>
              {patient.gender}
            </Chip>
            <Chip
              icon={patient.status === "Current" ? "account-check" : "account-clock"}
              style={[
                styles.patientMetaChip,
                {
                  backgroundColor:
                    patient.status === "Current" ? theme.colors.success + "20" : theme.colors.warning + "20",
                },
              ]}
            >
              {patient.status}
            </Chip>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY: contentTranslate }],
          },
        ]}
      >
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "info" && styles.activeTab]}
            onPress={() => setActiveTab("info")}
          >
            <Ionicons
              name={activeTab === "info" ? "information-circle" : "information-circle-outline"}
              size={24}
              color={activeTab === "info" ? theme.colors.primary : theme.colors.placeholder}
            />
            <Text style={[styles.tabText, activeTab === "info" && styles.activeTabText]}>Information</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "sessions" && styles.activeTab]}
            onPress={() => setActiveTab("sessions")}
          >
            <Ionicons
              name={activeTab === "sessions" ? "videocam" : "videocam-outline"}
              size={24}
              color={activeTab === "sessions" ? theme.colors.primary : theme.colors.placeholder}
            />
            <Text style={[styles.tabText, activeTab === "sessions" && styles.activeTabText]}>Sessions</Text>
          </TouchableOpacity>
        </View>

        <Divider />

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
        >
          {activeTab === "info" ? renderInfoTab() : renderSessionsTab()}
        </Animated.ScrollView>
      </Animated.View>

      <Portal>
        <FAB.Group
          open={fabOpen}
          icon={fabOpen ? "close" : "plus"}
          actions={[
            {
              icon: "video-plus",
              label: "Add Session Video",
              onPress: handleAddVideo,
            },
            {
              icon: "file-document-plus",
              label: "Add Document",
              onPress: () => console.log("Add document"),
            },
            {
              icon: "note-plus",
              label: "Add Note",
              onPress: () => console.log("Add note"),
            },
            {
              icon: "delete",
              label: "Delete Patient",
              color: theme.colors.error,
              onPress: () => setShowDeleteDialog(true),
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          color="white"
          fabStyle={{ backgroundColor: theme.colors.primary }}
        />
      </Portal>

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Patient</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete {patient.name}'s records? This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button color={theme.colors.error} onPress={handleDeletePatient}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 1,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  patientInfoHeader: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  patientName: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  patientMetaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  patientMetaChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 230,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    marginLeft: 8,
    color: theme.colors.placeholder,
    fontWeight: "500",
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  tabContent: {
    flex: 1,
  },
  sectionCard: {
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
  sectionText: {
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 12,
    flex: 1,
  },
  contactButton: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  documentItem: {
    paddingVertical: 8,
  },
  addDocumentButton: {
    marginTop: 16,
  },
  sessionsTitle: {
    marginBottom: 16,
  },
  sessionCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  sessionThumbnail: {
    height: 180,
  },
  playIconContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  sessionContent: {
    padding: 16,
  },
  sessionTitle: {
    fontSize: 18,
  },
  sessionMeta: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 12,
  },
  sessionChip: {
    marginRight: 8,
    backgroundColor: `${theme.colors.primary}10`,
  },
  sessionNotes: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.placeholder,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 20,
    color: theme.colors.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 10,
  },
})

export default PatientDetailScreen

