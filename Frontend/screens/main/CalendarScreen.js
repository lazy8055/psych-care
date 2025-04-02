"use client"

import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Animated, ScrollView, Modal } from "react-native" 
import {
  Text,
  Title,
  Card,
  Avatar,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
  FAB,
  TextInput,
  Surface,
  IconButton,
  Subheading,
  HelperText,
} from "react-native-paper"
import { Calendar } from "react-native-calendars"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import theme from "../../config/theme"
import { useAuth } from "../../context/AuthContext"
import API_ENDPOINTS from '../../config/api';

const { width } = Dimensions.get("window")

const Spacer = ({ height = 20 }) => <View style={{ height }} />;


// Time slots for appointments
const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
]

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [appointments, setAppointments] = useState([])
  const [markedDates, setMarkedDates] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    patientId: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00 AM",
    duration: "50 minutes",
    type: "Therapy Session",
    notes: "",
  })
  const [appointmentErrors, setAppointmentErrors] = useState({})
  const [availableTimeSlots, setAvailableTimeSlots] = useState([...TIME_SLOTS])

  const navigation = useNavigation()
  const { token, user } = useAuth()

  // Animation values
  const fadeAnim = new Animated.Value(0)
  const translateAnim = new Animated.Value(50)
  const modalAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fetchAppointments()

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    // Update available time slots when date changes
    updateAvailableTimeSlots(selectedDate)
  }, [selectedDate, appointments])

  const fetchAppointments = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, you would fetch from your API
      const response = await fetch(API_ENDPOINTS.APPOINTMENTS, {
        headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       const data = await response.json();

      // For demo purposes, using mock data
      const mockAppointments = [
        {
          id: "a1",
          patientId: "1",
          patientName: "John Doe",
          patientImage: "https://randomuser.me/api/portraits/men/32.jpg",
          date: "2023-05-15",
          time: "09:00 AM",
          duration: "50 minutes",
          type: "Therapy Session",
          status: "Confirmed",
          notes: "Follow-up on anxiety management techniques",
        },
        {
          id: "a2",
          patientId: "2",
          patientName: "Jane Smith",
          patientImage: "https://randomuser.me/api/portraits/women/44.jpg",
          date: "2023-05-15",
          time: "11:00 AM",
          duration: "50 minutes",
          type: "Initial Assessment",
          status: "Confirmed",
          notes: "First session - comprehensive assessment",
        },
        {
          id: "a3",
          patientId: "4",
          patientName: "Emily Davis",
          patientImage: "https://randomuser.me/api/portraits/women/28.jpg",
          date: "2025-05-16",
          time: "10:00 AM",
          duration: "50 minutes",
          type: "Therapy Session",
          status: "Confirmed",
          notes: "Medication review and CBT continuation",
        },
        {
          id: "a4",
          patientId: "6",
          patientName: "Sarah Brown",
          patientImage: "https://randomuser.me/api/portraits/women/65.jpg",
          date: "2025-05-17",
          time: "02:00 PM",
          duration: "50 minutes",
          type: "Therapy Session",
          status: "Confirmed",
          notes: "OCD treatment follow-up",
        },
        {
          id: "a5",
          patientId: "1",
          patientName: "John Doe",
          patientImage: "https://randomuser.me/api/portraits/men/32.jpg",
          date: "2025-05-22",
          time: "09:00 AM",
          duration: "50 minutes",
          type: "Therapy Session",
          status: "Confirmed",
          notes: "Continue anxiety management techniques",
        },
      ]
      

      setAppointments(data.appointments)

      // Create marked dates for calendar
      const marked = {}
      mockAppointments.forEach((appointment) => {
        marked[appointment.date] = {
          marked: true,
          dotColor: theme.colors.primary,
          selected: appointment.date === selectedDate,
          selectedColor: `${theme.colors.primary}30`,
        }
      })

      // Ensure today is marked if it's the selected date
      if (selectedDate === new Date().toISOString().split("T")[0]) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: `${theme.colors.primary}30`,
        }
      }

      setMarkedDates(marked)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching appointments:", err)
      setError("Failed to load appointments. Please try again.")
      setIsLoading(false)
    }
  }

  const updateAvailableTimeSlots = (date) => {
    // Get all appointments for the selected date
    const dateAppointments = appointments.filter((app) => app.date === date)

    // Filter out already booked time slots
    const bookedSlots = dateAppointments.map((app) => app.time)
    const available = TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot))

    setAvailableTimeSlots(available)
  }

  const handleDateSelect = (day) => {
    const selected = day.dateString
    setSelectedDate(selected)

    // Update new appointment date
    setNewAppointment((prev) => ({
      ...prev,
      date: selected,
    }))

    // Update marked dates
    const newMarkedDates = { ...markedDates }

    // Reset previously selected date
    Object.keys(newMarkedDates).forEach((date) => {
      if (newMarkedDates[date]?.selected) {
        newMarkedDates[date] = {
          ...newMarkedDates[date],
          selected: false,
        }
      }
    })

    // Mark new selected date
    newMarkedDates[selected] = {
      ...newMarkedDates[selected],
      selected: true,
      selectedColor: `${theme.colors.primary}30`,
    }

    setMarkedDates(newMarkedDates)
  }

  const getAppointmentsForSelectedDate = () => {
    return appointments.filter((appointment) => appointment.date === selectedDate)
  }

  const handleAppointmentPress = (appointment) => {
    navigation.navigate("PatientDetail", { patientId: appointment.patientId })
  }

  const handleAddAppointment = () => {
    setNewAppointment({
      patientName: "",
      patientId: "",
      date: selectedDate,
      time: availableTimeSlots[0] || "09:00 AM",
      duration: "50 minutes",
      type: "Therapy Session",
      notes: "",
    })
    setAppointmentErrors({})
    setShowAddAppointmentModal(true)

    // Animate modal
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const validateAppointmentForm = () => {
    const errors = {}

    if (!newAppointment.patientName) errors.patientName = "Patient name is required"
    if (!newAppointment.time) errors.time = "Time is required"
    if (!newAppointment.type) errors.type = "Appointment type is required"

    setAppointmentErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveAppointment = () => {
    if (!validateAppointmentForm()) return

    // Create new appointment
    const newAppointmentObj = {
      id: `a${Date.now()}`,
      patientId: newAppointment.patientId || `temp-${Date.now()}`,
      patientName: newAppointment.patientName,
      patientImage: "https://randomuser.me/api/portraits/lego/1.jpg", // Placeholder
      date: newAppointment.date,
      time: newAppointment.time,
      duration: newAppointment.duration,
      type: newAppointment.type,
      status: "Confirmed",
      notes: newAppointment.notes,
    }

    // Add to appointments list
    setAppointments((prev) => [...prev, newAppointmentObj])

    // Update marked dates
    const newMarkedDates = { ...markedDates }
    newMarkedDates[newAppointment.date] = {
      ...newMarkedDates[newAppointment.date],
      marked: true,
      dotColor: theme.colors.primary,
    }
    setMarkedDates(newMarkedDates)

    // Close modal
    setShowAddAppointmentModal(false)
    modalAnim.setValue(0)
  }

  const renderAppointmentCard = ({ item, index }) => {
    // Create staggered animation for each card
    const itemFadeAnim = new Animated.Value(0)
    const itemTranslateAnim = new Animated.Value(30)

    Animated.parallel([
      Animated.timing(itemFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(itemTranslateAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start()

    return (
      <Animated.View
        style={{
          opacity: itemFadeAnim,
          transform: [{ translateY: itemTranslateAnim }],
        }}
      >
        <TouchableOpacity onPress={() => handleAppointmentPress(item)} activeOpacity={0.7}>
          <Card style={styles.appointmentCard}>
            <Card.Content>
              <View style={styles.appointmentHeader}>
                <View style={styles.patientInfo}>
                  <Avatar.Image source={{ uri: item.patientImage }} size={50} style={styles.patientAvatar} />
                  <View style={styles.patientTextInfo}>
                    <Title style={styles.patientName}>{item.patientName}</Title>
                    <Chip mode="outlined" style={styles.appointmentType} textStyle={{ fontSize: 12 }}>
                      {item.type}
                    </Chip>
                  </View>
                </View>
                <View style={styles.timeContainer}>
                  <Ionicons name="time" size={16} color={theme.colors.primary} />
                  <Text style={styles.timeText}>{item.time}</Text>
                  <Text style={styles.durationText}>({item.duration})</Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <Text style={styles.notesText}>{item.notes}</Text>

              <View style={styles.appointmentActions}>
                <Button
                  mode="contained"
                  compact
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => handleAppointmentPress(item)}
                >
                  View Patient
                </Button>
               
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar" size={60} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No appointments for this date</Text>
      
    </View>
  )

  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <View style={styles.container}>
      
        <Calendar
          current={selectedDate}
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          theme={{
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.primary,
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: "#ffffff",
            todayTextColor: theme.colors.primary,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.disabled,
            dotColor: theme.colors.primary,
            selectedDotColor: "#ffffff",
            arrowColor: theme.colors.primary,
            monthTextColor: theme.colors.primary,
            indicatorColor: theme.colors.primary,
            textDayFontWeight: "300",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "500",
          }}
        />
      <Divider />
      

      <Spacer height={30} />

      <View style={styles.appointmentsContainer}>
        <View style={styles.appointmentsHeader}>
          <Title style={styles.dateTitle}>{formatDate(selectedDate)}</Title>
          <Text style={styles.appointmentCount}>{getAppointmentsForSelectedDate().length} Appointments</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={50} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={fetchAppointments} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        ) : (
          <FlatList
            data={getAppointmentsForSelectedDate()}
            renderItem={renderAppointmentCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <FAB style={styles.fab} icon="plus" label="New Appointment" onPress={handleAddAppointment} />

      {/* Add Appointment Modal */}
      <Modal
        visible={showAddAppointmentModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowAddAppointmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalAnim,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Surface style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Title>Add New Appointment</Title>
                <IconButton icon="close" size={24} onPress={() => setShowAddAppointmentModal(false)} />
              </View>

              <Divider style={styles.divider} />

              <ScrollView style={styles.modalScrollContent}>
                <TextInput
                  label="Patient Name"
                  value={newAppointment.patientName}
                  onChangeText={(text) => setNewAppointment((prev) => ({ ...prev, patientName: text }))}
                  style={styles.input}
                  mode="outlined"
                  error={!!appointmentErrors.patientName}
                />
                {appointmentErrors.patientName && <HelperText type="error">{appointmentErrors.patientName}</HelperText>}

                <Subheading style={styles.sectionSubheading}>Appointment Date</Subheading>
                <Text style={styles.dateText}>{formatDate(newAppointment.date)}</Text>

                <Subheading style={styles.sectionSubheading}>Available Time Slots</Subheading>
                {availableTimeSlots.length > 0 ? (
                  <View style={styles.timeSlotContainer}>
                    {availableTimeSlots.map((slot) => (
                      <Chip
                        key={slot}
                        selected={newAppointment.time === slot}
                        onPress={() => setNewAppointment((prev) => ({ ...prev, time: slot }))}
                        style={[styles.timeSlotChip, newAppointment.time === slot && styles.selectedTimeSlot]}
                        textStyle={newAppointment.time === slot ? { color: "white" } : {}}
                      >
                        {slot}
                      </Chip>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noSlotsText}>No available time slots for this date</Text>
                )}
                {appointmentErrors.time && <HelperText type="error">{appointmentErrors.time}</HelperText>}

                <TextInput
                  label="Duration"
                  value={newAppointment.duration}
                  onChangeText={(text) => setNewAppointment((prev) => ({ ...prev, duration: text }))}
                  style={styles.input}
                  mode="outlined"
                />

                <TextInput
                  label="Appointment Type"
                  value={newAppointment.type}
                  onChangeText={(text) => setNewAppointment((prev) => ({ ...prev, type: text }))}
                  style={styles.input}
                  mode="outlined"
                  error={!!appointmentErrors.type}
                />
                {appointmentErrors.type && <HelperText type="error">{appointmentErrors.type}</HelperText>}

                <TextInput
                  label="Notes"
                  value={newAppointment.notes}
                  onChangeText={(text) => setNewAppointment((prev) => ({ ...prev, notes: text }))}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              <Divider style={styles.divider} />

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setShowAddAppointmentModal(false)} style={styles.modalButton}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleSaveAppointment} style={styles.modalButton}>
                  Save
                </Button>
              </View>
            </Surface>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  calendarContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 16,
  },
  appointmentsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  appointmentsHeader: {
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  appointmentCount: {
    color: theme.colors.placeholder,
  },
  listContent: {
    paddingBottom: 80,
  },
  appointmentCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  patientAvatar: {
    backgroundColor: theme.colors.primary + "20",
  },
  patientTextInfo: {
    marginLeft: 12,
  },
  patientName: {
    fontSize: 16,
  },
  appointmentType: {
    marginTop: 4,
    height: 35,
    backgroundColor: `${theme.colors.primary}10`,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.primary}10`,
    paddingHorizontal: 0,
    paddingVertical: 5,
    borderRadius: 16,
  },
  timeText: {
    marginLeft: 0,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  durationText: {
    marginLeft: 0,
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  divider: {
    marginVertical: 12,
  },
  notesText: {
    marginBottom: 12,
  },
  appointmentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: theme.colors.primary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 20,
    color: theme.colors.placeholder,
  },
  addButton: {
    marginTop: 10,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalScrollContent: {
    maxHeight: 400,
  },
  input: {
    marginBottom: 16,
  },
  sectionSubheading: {
    marginTop: 8,
    marginBottom: 8,
    color: theme.colors.primary,
  },
  dateText: {
    fontSize: 16,
    marginBottom: 16,
  },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  timeSlotChip: {
    margin: 4,
  },
  selectedTimeSlot: {
    backgroundColor: theme.colors.primary,
  },
  noSlotsText: {
    color: theme.colors.error,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    marginLeft: 8,
  },
})

export default CalendarScreen

