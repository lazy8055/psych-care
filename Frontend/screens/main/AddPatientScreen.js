"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native"
import {
  Text,
  Title,
  TextInput,
  Button,
  Divider,
  Chip,
  HelperText,
  RadioButton,
  IconButton,
  Surface,
  Subheading,
  ActivityIndicator,
} from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { useNavigation } from "@react-navigation/native"
import { v4 as uuidv4 } from "uuid"
import theme from "../../config/theme"
import { useAuth } from "../../context/AuthContext"
import API_ENDPOINTS from "../../config/api"


const AddPatientScreen = () => {
  const navigation = useNavigation()
  const { token } = useAuth()
  const scrollViewRef = useRef(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [errors, setErrors] = useState({})

  // Patient data state
  const [patientData, setPatientData] = useState({
    name: "",
    age: "",
    gender: "Male",
    image: null,
    status: "Current",
    contactDetails: {
      phone: "",
      email: "",
    },
    address: "",
    medicalHistory: "",
    familyHistory: "",
    presentingProblem: "",
    clinicalObservations: "",
    assessment: "",
    treatmentPlan: "",
    medications: "",
    diagnosis: "",
    lifestyle: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    sessions: [],
    documents: [],
  })

  // Request permissions for image picker
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Sorry, we need camera roll permissions to upload patient photos."
          )
        }
      }
    }

    requestPermissions()
  }, [])

  // Form sections
  const sections = [
    { title: "Basic Information", icon: "person" },
    { title: "Contact Details", icon: "call" },
    { title: "Medical Information", icon: "medical" },
    { title: "Clinical Assessment", icon: "clipboard" },
    { title: "Treatment & Lifestyle", icon: "fitness" },
    { title: "Emergency Contact", icon: "alert-circle" },
  ]

  // Update patient data
  const updateField = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setPatientData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setPatientData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        updateField("image", result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to select image. Please try again.")
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    // Basic Information validation
    if (!patientData.name) newErrors.name = "Patient name is required"
    if (!patientData.age) newErrors.age = "Age is required"
    else if (isNaN(patientData.age)) newErrors.age = "Age must be a number"

    // Contact Details validation
    if (!patientData.contactDetails.phone) newErrors["contactDetails.phone"] = "Phone number is required"
    if (!patientData.contactDetails.email) newErrors["contactDetails.email"] = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(patientData.contactDetails.email))
      newErrors["contactDetails.email"] = "Email is invalid"
    if (!patientData.address) newErrors.address = "Address is required"

    // Medical Information validation
    //if (!patientData.medicalHistory) newErrors.medicalHistory = "Medical history is required"
    //if (!patientData.presentingProblem) newErrors.presentingProblem = "Presenting problem is required"

    // Clinical Assessment validation
    //if (!patientData.clinicalObservations) newErrors.clinicalObservations = "Clinical observations are required"
    //if (!patientData.assessment) newErrors.assessment = "Assessment is required"
    if (!patientData.diagnosis) newErrors.diagnosis = "Diagnosis is required"

    // Treatment & Lifestyle validation
    //if (!patientData.treatmentPlan) newErrors.treatmentPlan = "Treatment plan is required"

    // Emergency Contact validation
    if (!patientData.emergencyContact.name) newErrors["emergencyContact.name"] = "Emergency contact name is required"
    if (!patientData.emergencyContact.phone)
      newErrors["emergencyContact.phone"] = "Emergency contact phone is required"
    if (!patientData.emergencyContact.relationship)
      newErrors["emergencyContact.relationship"] = "Relationship is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Find the first section with errors
      for (let i = 0; i < sections.length; i++) {
        const sectionFields = getSectionFields(i)
        const hasError = sectionFields.some((field) => errors[field])
        if (hasError) {
          setCurrentSection(i)
          scrollViewRef.current?.scrollTo({ y: 0, animated: true })
          return
        }
      }
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would call your API to save the patient
      const response = await fetch(API_ENDPOINTS.PATIENTS, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({
           ...patientData,
           //id: uuidv4(),
           sessions: [],
           documents: []
         }),
       });
       const data = await response.json();

      // Simulate API delay
      setTimeout(() => {
        setIsSubmitting(false)
        Alert.alert(
          "Success",
          "Patient added successfully",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        )
      }, 1500)
    } catch (error) {
      console.error("Error adding patient:", error)
      setIsSubmitting(false)
      Alert.alert("Error", "Failed to add patient. Please try again.")
    }
  }

  // Get fields for a specific section
  const getSectionFields = (sectionIndex) => {
    switch (sectionIndex) {
      case 0: // Basic Information
        return ["name", "age", "gender", "image", "status"]
      case 1: // Contact Details
        return ["contactDetails.phone", "contactDetails.email", "address"]
      case 2: // Medical Information
        return ["medicalHistory", "familyHistory", "presentingProblem"]
      case 3: // Clinical Assessment
        return ["clinicalObservations", "assessment"]
      case 4: // Treatment & Lifestyle
        return ["treatmentPlan", "medications", "lifestyle"]
      case 5: // Emergency Contact
        return ["emergencyContact.name", "emergencyContact.phone", "emergencyContact.relationship"]
      default:
        return []
    }
  }

  // Navigate to next section
  const goToNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }
  }

  // Navigate to previous section
  const goToPrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }
  }

  // Render Basic Information section
  const renderBasicInformation = () => (
    <View style={styles.sectionContent}>
      <TextInput
        label="Patient Name *"
        value={patientData.name}
        onChangeText={(text) => updateField("name", text)}
        style={styles.input}
        mode="outlined"
        error={!!errors.name}
      />
      {errors.name && <HelperText type="error">{errors.name}</HelperText>}

      <TextInput
        label="Age *"
        value={patientData.age}
        onChangeText={(text) => updateField("age", text)}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        error={!!errors.age}
      />
      {errors.age && <HelperText type="error">{errors.age}</HelperText>}

      <Text style={styles.inputLabel}>Gender *</Text>
      <View style={styles.radioGroup}>
        <View style={styles.radioButton}>
          <RadioButton
            value="Male"
            status={patientData.gender === "Male" ? "checked" : "unchecked"}
            onPress={() => updateField("gender", "Male")}
            color={theme.colors.primary}
          />
          <Text style={styles.radioLabel}>Male</Text>
        </View>
        <View style={styles.radioButton}>
          <RadioButton
            value="Female"
            status={patientData.gender === "Female" ? "checked" : "unchecked"}
            onPress={() => updateField("gender", "Female")}
            color={theme.colors.primary}
          />
          <Text style={styles.radioLabel}>Female</Text>
        </View>
        <View style={styles.radioButton}>
          <RadioButton
            value="Other"
            status={patientData.gender === "Other" ? "checked" : "unchecked"}
            onPress={() => updateField("gender", "Other")}
            color={theme.colors.primary}
          />
          <Text style={styles.radioLabel}>Other</Text>
        </View>
      </View>

      <Text style={styles.inputLabel}>Patient Status *</Text>
      <View style={styles.radioGroup}>
        <View style={styles.radioButton}>
          <RadioButton
            value="Current"
            status={patientData.status === "Current" ? "checked" : "unchecked"}
            onPress={() => updateField("status", "Current")}
            color={theme.colors.primary}
          />
          <Text style={styles.radioLabel}>Current</Text>
        </View>
        <View style={styles.radioButton}>
          <RadioButton
            value="Past"
            status={patientData.status === "Past" ? "checked" : "unchecked"}
            onPress={() => updateField("status", "Past")}
            color={theme.colors.primary}
          />
          <Text style={styles.radioLabel}>Past</Text>
        </View>
      </View>

      <Text style={styles.inputLabel}>Patient Photo</Text>
      <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
        {patientData.image ? (
          <Image source={{ uri: patientData.image }} style={styles.patientImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={40} color={theme.colors.primary} />
            <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )

  // Render Contact Details section
  const renderContactDetails = () => (
    <View style={styles.sectionContent}>
      <TextInput
        label="Phone Number *"
        value={patientData.contactDetails.phone}
        onChangeText={(text) => updateField("contactDetails.phone", text)}
        style={styles.input}
        mode="outlined"
        keyboardType="phone-pad"
        error={!!errors["contactDetails.phone"]}
        left={<TextInput.Icon icon="phone" />}
      />
      {errors["contactDetails.phone"] && <HelperText type="error">{errors["contactDetails.phone"]}</HelperText>}

      <TextInput
        label="Email Address *"
        value={patientData.contactDetails.email}
        onChangeText={(text) => updateField("contactDetails.email", text)}
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
        error={!!errors["contactDetails.email"]}
        left={<TextInput.Icon icon="email" />}
      />
      {errors["contactDetails.email"] && <HelperText type="error">{errors["contactDetails.email"]}</HelperText>}

      <TextInput
        label="Address *"
        value={patientData.address}
        onChangeText={(text) => updateField("address", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={3}
        error={!!errors.address}
        left={<TextInput.Icon icon="map-marker" />}
      />
      {errors.address && <HelperText type="error">{errors.address}</HelperText>}
    </View>
  )

  // Render Medical Information section
  const renderMedicalInformation = () => (
    <View style={styles.sectionContent}>
      <TextInput
        label="Medical History"
        value={patientData.medicalHistory}
        onChangeText={(text) => updateField("medicalHistory", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
        error={!!errors.medicalHistory}
      />
      {errors.medicalHistory && <HelperText type="error">{errors.medicalHistory}</HelperText>}
      <HelperText type="info">
        Include significant medical conditions, allergies, and previous mental health treatments.
      </HelperText>

      <TextInput
        label="Family History"
        value={patientData.familyHistory}
        onChangeText={(text) => updateField("familyHistory", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
      />
      <HelperText type="info">
        Include family mental health history and relevant medical conditions.
      </HelperText>

      <TextInput
        label="Presenting Problem"
        value={patientData.presentingProblem}
        onChangeText={(text) => updateField("presentingProblem", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
        error={!!errors.presentingProblem}
      />
      {errors.presentingProblem && <HelperText type="error">{errors.presentingProblem}</HelperText>}
      <HelperText type="info">
        Describe the patient's primary concerns, symptoms, and when they started.
      </HelperText>


      
    </View>
  )

  // Render Clinical Assessment section
  const renderClinicalAssessment = () => (
    <View style={styles.sectionContent}>
      <TextInput
        label="Clinical Observations"
        value={patientData.clinicalObservations}
        onChangeText={(text) => updateField("clinicalObservations", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
        error={!!errors.clinicalObservations}
      />
      {errors.clinicalObservations && <HelperText type="error">{errors.clinicalObservations}</HelperText>}
      <HelperText type="info">
        Note appearance, behavior, mood, affect, speech, thought process, and other observations.
      </HelperText>

      <TextInput
        label="Assessment & Diagnosis"
        value={patientData.assessment}
        onChangeText={(text) => updateField("assessment", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
        error={!!errors.assessment}
      />
      {errors.assessment && <HelperText type="error">{errors.assessment}</HelperText>}
      <HelperText type="info">
        Include diagnosis, differential diagnoses, and assessment scores if applicable.
      </HelperText>

      <TextInput
        label="Diagnosis *"
        value={patientData.diagnosis}
        onChangeText={(text) => updateField("diagnosis", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
        error={!!errors.Diagnosis}
      />
      {errors.Diagnosis && <HelperText type="error">{errors.Diagnosis}</HelperText>}
      <HelperText type="info">
        Describe the patient's primary problem in one word like PTSD, OCD, etc... If unknown use "Unknown"
      </HelperText>

      
    </View>
  )

  // Render Treatment & Lifestyle section
  const renderTreatmentLifestyle = () => (
    <View style={styles.sectionContent}>
      <TextInput
        label="Treatment Plan"
        value={patientData.treatmentPlan}
        onChangeText={(text) => updateField("treatmentPlan", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
        error={!!errors.treatmentPlan}
      />
      {errors.treatmentPlan && <HelperText type="error">{errors.treatmentPlan}</HelperText>}
      <HelperText type="info">
        Outline therapeutic approach, frequency of sessions, goals, and interventions.
      </HelperText>

      <TextInput
        label="Medications"
        value={patientData.medications}
        onChangeText={(text) => updateField("medications", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={3}
      />
      <HelperText type="info">
        List current medications, dosages, and previous medications if relevant.
      </HelperText>

      <TextInput
        label="Lifestyle"
        value={patientData.lifestyle}
        onChangeText={(text) => updateField("lifestyle", text)}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={3}
      />
      <HelperText type="info">
        Note occupation, exercise habits, sleep patterns, diet, and substance use.
      </HelperText>
    </View>
  )

  // Render Emergency Contact section
  const renderEmergencyContact = () => (
    <View style={styles.sectionContent}>
      <TextInput
        label="Emergency Contact Name *"
        value={patientData.emergencyContact.name}
        onChangeText={(text) => updateField("emergencyContact.name", text)}
        style={styles.input}
        mode="outlined"
        error={!!errors["emergencyContact.name"]}
        left={<TextInput.Icon icon="account" />}
      />
      {errors["emergencyContact.name"] && (
        <HelperText type="error">{errors["emergencyContact.name"]}</HelperText>
      )}

      <TextInput
        label="Emergency Contact Phone *"
        value={patientData.emergencyContact.phone}
        onChangeText={(text) => updateField("emergencyContact.phone", text)}
        style={styles.input}
        mode="outlined"
        keyboardType="phone-pad"
        error={!!errors["emergencyContact.phone"]}
        left={<TextInput.Icon icon="phone" />}
      />
      {errors["emergencyContact.phone"] && (
        <HelperText type="error">{errors["emergencyContact.phone"]}</HelperText>
      )}

      <TextInput
        label="Relationship to Patient *"
        value={patientData.emergencyContact.relationship}
        onChangeText={(text) => updateField("emergencyContact.relationship", text)}
        style={styles.input}
        mode="outlined"
        error={!!errors["emergencyContact.relationship"]}
        left={<TextInput.Icon icon="account-multiple" />}
      />
      {errors["emergencyContact.relationship"] && (
        <HelperText type="error">{errors["emergencyContact.relationship"]}</HelperText>
      )}
    </View>
  )

  // Render current section content
  const renderSectionContent = () => {
    switch (currentSection) {
      case 0:
        return renderBasicInformation()
      case 1:
        return renderContactDetails()
      case 2:
        return renderMedicalInformation()
      case 3:
        return renderClinicalAssessment()
      case 4:
        return renderTreatmentLifestyle()
      case 5:
        return renderEmergencyContact()
      default:
        return null
    }
  }

  // Header right actions
  const headerRightActions = (
    <IconButton
      icon="close"
      color={theme.colors.placeholder}
      size={24}
      onPress={() => {
        Alert.alert(
          "Discard Changes",
          "Are you sure you want to discard all changes?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Discard",
              onPress: () => navigation.goBack(),
              style: "destructive",
            },
          ]
        )
      }}
    />
  )

  return (
    <View style={styles.container}>
      

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.progressContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.progressScroll}>
            {sections.map((section, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.progressItem, currentSection === index && styles.activeProgressItem]}
                onPress={() => setCurrentSection(index)}
              >
                <Ionicons
                  name={section.icon}
                  size={20}
                  color={currentSection === index ? theme.colors.primary : theme.colors.placeholder}
                />
                <Text
                  style={[
                    styles.progressText,
                    currentSection === index && styles.activeProgressText,
                  ]}
                >
                  {section.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name={sections[currentSection].icon} size={24} color={theme.colors.primary} />
              <Title style={styles.sectionTitle}>{sections[currentSection].title}</Title>
            </View>
            <Divider style={styles.divider} />
            {renderSectionContent()}
          </Surface>

          <View style={styles.navigationButtons}>
            {currentSection > 0 && (
              <Button
                mode="outlined"
                onPress={goToPrevSection}
                style={styles.navigationButton}
                icon="arrow-left"
              >
                Previous
              </Button>
            )}
            {currentSection < sections.length - 1 ? (
              <Button
                mode="contained"
                onPress={goToNextSection}
                style={[styles.navigationButton, styles.primaryButton]}
                icon="arrow-right"
                contentStyle={{ flexDirection: "row-reverse" }}
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={[styles.navigationButton, styles.primaryButton]}
                icon="check"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Save Patient
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  progressContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  progressScroll: {
    paddingHorizontal: 16,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
  },
  activeProgressItem: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  activeProgressText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    marginLeft: 12,
    fontSize: 20,
  },
  divider: {
    marginBottom: 16,
  },
  sectionContent: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: theme.colors.text,
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  radioLabel: {
    marginLeft: 4,
  },
  imagePickerContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginVertical: 16,
    alignSelf: "center",
  },
  patientImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    borderStyle: "dashed",
    borderRadius: 60,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.primary,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  navigationButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
})

export default AddPatientScreen
