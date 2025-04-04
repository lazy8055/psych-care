"use client"

import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, Animated, Alert, KeyboardAvoidingView, Platform } from "react-native"
import {
  Text,
  Title,
  Button,
  Surface,
  TextInput,
  Chip,
  Divider,
  IconButton,
  ActivityIndicator,
  FAB,
  Portal,
  Dialog,
  Paragraph,
} from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import theme from "../../config/theme"
import API_ENDPOINTS from '../../config/api';
import { useAuth } from '../../context/AuthContext';


// Time slots for medication
const TIME_SLOTS = [
  { id: "morning", label: "Morning", icon: "sunny-outline", time: "08:00 AM" },
  { id: "afternoon", label: "Afternoon", icon: "partly-sunny-outline", time: "01:00 PM" },
  { id: "evening", label: "Evening", icon: "moon-outline", time: "07:00 PM" },
  { id: "bedtime", label: "Bedtime", icon: "bed-outline", time: "10:00 PM" },
]

const MedicationManagementScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { patientId } = route.params

  const [medications, setMedications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMedication, setEditingMedication] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [medicationToDelete, setMedicationToDelete] = useState(null)

  
const { token } = useAuth();

  // Form state
  const [medicationForm, setMedicationForm] = useState({
    name: "",
    timeSlots: [],
  })
  const [formErrors, setFormErrors] = useState({})

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateYAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    fetchMedications()
  }, [patientId])

  const fetchMedications = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, you would fetch from your API
       const response = await fetch(API_ENDPOINTS.PATIENT_MEDICATIONS(patientId), {
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       const data = await response.json();

      // For demo purposes, using mock data
      
      if(!data.medicine) data.medicine=[]
      // Simulate network delay
      setTimeout(() => {
        setMedications(data.medicine)
        setIsLoading(false)
      }, 800)
    } catch (err) {
      console.error("Error fetching medications:", err)
      setError("Failed to load medications. Please try again.")
      setIsLoading(false)
    }
  }

  const handleAddMedication = () => {
    setMedicationForm({
      name: "",
      timeSlots: [],
    })
    setFormErrors({})
    setShowAddForm(true)
    setEditingMedication(null)
  }

  const handleEditMedication = (medication) => {
    setMedicationForm({
      ...medication,
    })
    setFormErrors({})
    setShowAddForm(true)
    setEditingMedication(medication)
  }

  const handleDeletePrompt = (medication) => {
    setMedicationToDelete(medication)
    setShowDeleteDialog(true)
  }

  const handleDeleteMedication = async () => {
    if (!medicationToDelete) return

    setShowDeleteDialog(false)
    setIsSubmitting(true)

    try {
      // In a real app, you would call your API
       await fetch(`${API_ENDPOINTS.MEDICATIONS}/${medicationToDelete.id}`, {
         method: 'DELETE',
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });

      // For demo purposes, just update the local state
      setTimeout(() => {
        setMedications(medications.filter((med) => med.id !== medicationToDelete.id))
        setMedicationToDelete(null)
        setIsSubmitting(false)

        // Show success message
        Alert.alert("Success", "Medication deleted successfully")
      }, 800)
    } catch (error) {
      console.error("Error deleting medication:", error)
      setIsSubmitting(false)
      Alert.alert("Error", "Failed to delete medication. Please try again.")
    }
  }

  const toggleTimeSlot = (slotId) => {
    const currentSlots = [...medicationForm.timeSlots]
    if (currentSlots.includes(slotId)) {
      // Remove the time slot
      setMedicationForm({
        ...medicationForm,
        timeSlots: currentSlots.filter((id) => id !== slotId),
      })
    } else {
      // Add the time slot
      setMedicationForm({
        ...medicationForm,
        timeSlots: [...currentSlots, slotId],
      })
    }

    // Clear error when user selects
    if (formErrors.timeSlots) {
      setFormErrors({
        ...formErrors,
        timeSlots: null,
      })
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!medicationForm.name.trim()) {
      errors.name = "Medication name is required"
    }

    if (medicationForm.timeSlots.length === 0) {
      errors.timeSlots = "At least one time slot must be selected"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const isEditing = !!editingMedication
      const medicationData = {
        ...medicationForm,
        id: isEditing ? editingMedication.id : `med${Date.now()}`,
      }

      // In a real app, you would call your API
       const url = isEditing
         ? `${API_ENDPOINTS.MEDICATIONS}/${editingMedication.id}`
         : `${API_ENDPOINTS.MEDICATIONS}/${patientId}`;
      
       const method = isEditing ? 'PUT' : 'POST';
      
       const response = await fetch(url, {
         method,
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({
           patientId,
           ...medicationData
         })
       });
      //
       const data = await response.json();

      // For demo purposes, just update the local state
      setTimeout(() => {
        if (isEditing) {
          setMedications(medications.map((med) => (med.id === editingMedication.id ? medicationData : med)))
        } else {
          setMedications([...medications, medicationData])
        }

        setShowAddForm(false)
        setEditingMedication(null)
        setIsSubmitting(false)

        // Show success message
        Alert.alert("Success", `Medication ${isEditing ? "updated" : "added"} successfully`)
      }, 800)
    } catch (error) {
      console.error("Error saving medication:", error)
      setIsSubmitting(false)
      Alert.alert("Error", "Failed to save medication. Please try again.")
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingMedication(null)
    setFormErrors({})
  }

  const renderMedicationItem = (medication, index) => {
    return (
      <Surface style={styles.medicationCard} key={medication.id}>
        <View style={styles.medicationHeader}>
          <Title style={styles.medicationName}>{medication.name}</Title>
          <View style={styles.actionButtons}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditMedication(medication)}
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeletePrompt(medication)}
              style={styles.actionButton}
            />
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.medicationTimeSlots}>
          {medication.timeSlots.map((slotId) => {
            const slot = TIME_SLOTS.find((s) => s.id === slotId)
            return (
              <Chip
                key={slotId}
                style={styles.timeSlotChip}
                icon={() => <Ionicons name={slot.icon} size={16} color={theme.colors.primary} />}
              >
                {slot.label}
              </Chip>
            )
          })}
        </View>
        
      </Surface>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medkit-outline" size={80} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No medications found</Text>
      <Text style={styles.emptySubtext}>Add medications to track patient's treatment</Text>
      <Button mode="contained" onPress={handleAddMedication} style={styles.addButton} icon="plus">
        Add Medication
      </Button>
    </View>
  )

  const renderAddForm = () => (
    <Portal>
      <Dialog visible={showAddForm} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title>{editingMedication ? "Edit Medication" : "Add Medication"}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Medication Name"
            value={medicationForm.name}
            onChangeText={(text) => setMedicationForm({ ...medicationForm, name: text })}
            style={styles.input}
            error={!!formErrors.name}
          />
          {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}

          <Text style={styles.timeSlotLabel}>When to take:</Text>
          <View style={styles.timeSlotContainer}>
            {TIME_SLOTS.map((slot) => (
              <Chip
                key={slot.id}
                style={[
                  styles.timeSlotSelectionChip,
                  medicationForm.timeSlots.includes(slot.id) && styles.selectedTimeSlot,
                ]}
                textStyle={{
                  color: medicationForm.timeSlots.includes(slot.id) ? "white" : theme.colors.text,
                }}
                icon={() => (
                  <Ionicons
                    name={slot.icon}
                    size={16}
                    color={medicationForm.timeSlots.includes(slot.id) ? "white" : theme.colors.primary}
                  />
                )}
                onPress={() => toggleTimeSlot(slot.id)}
                selected={medicationForm.timeSlots.includes(slot.id)}
              >
                {slot.label}
              </Chip>
            ))}
          </View>
          {formErrors.timeSlots && <Text style={styles.errorText}>{formErrors.timeSlots}</Text>}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleCancel}>Cancel</Button>
          <Button onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
            {editingMedication ? "Update" : "Save"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )

  return (
    <View style={styles.container}>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading medications...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={fetchMedications} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.medicationsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
            {medications.length === 0 ? (
              renderEmptyState()
            ) : (
              <ScrollView style={styles.medicationsList} contentContainerStyle={styles.medicationsListContent}>
                {medications.map(renderMedicationItem)}
                <Button mode="contained" onPress={handleAddMedication} style={styles.addButton} icon="plus">
        Add Medication
      </Button>
              </ScrollView>
            )}
          </Animated.View>
        )}

        {renderAddForm()}

        <FAB style={styles.fab} icon="plus" onPress={handleAddMedication} color="red" />
      </KeyboardAvoidingView>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Medication</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to delete {medicationToDelete?.name}?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button
              color={theme.colors.error}
              onPress={handleDeleteMedication}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
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
  content: {
    flex: 1,
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
    color: theme.colors.error,
    marginTop: 8,
    fontSize: 14,
  },
  retryButton: {
    marginTop: 20,
  },
  medicationsContainer: {
    flex: 1,
  },
  medicationsList: {
    flex: 1,
  },
  medicationsListContent: {
    padding: 16,
    paddingBottom: 80,
  },
  medicationCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    padding: 16,
  },
  medicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medicationName: {
    fontSize: 18,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    margin: 0,
  },
  divider: {
    marginVertical: 12,
  },
  medicationTimeSlots: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  timeSlotChip: {
    margin: 4,
    backgroundColor: `${theme.colors.primary}15`,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: theme.colors.placeholder,
  },
  emptySubtext: {
    marginTop: 8,
    marginBottom: 20,
    textAlign: "center",
    color: theme.colors.placeholder,
  },
  addButton: {
    paddingHorizontal: 20,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  dialog: {
    borderRadius: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  timeSlotLabel: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  timeSlotSelectionChip: {
    margin: 4,
  },
  selectedTimeSlot: {
    backgroundColor: theme.colors.primary,
  },
})

export default MedicationManagementScreen

