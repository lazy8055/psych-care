"use client"

import { useState, useEffect,useCallback  } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Animated } from "react-native"
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Avatar,
  Chip,
  ActivityIndicator,
  Text,
  Button,
  FAB,
  Divider,
} from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import theme from "../../config/theme"
import API_ENDPOINTS from "../../config/api"
import { useAuth } from "../../context/AuthContext"
import { useFocusEffect } from "@react-navigation/native";


const { width } = Dimensions.get("window")

const PatientsScreen = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("Current") // 'Current' or 'Past'
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigation = useNavigation()
  const { token } = useAuth()

  // Animation values
  const fadeAnim = new Animated.Value(0)
  const translateAnim = new Animated.Value(50)

  useEffect(() => {
    fetchPatients()

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
    filterPatients()
  }, [searchQuery, filter, patients])

  useFocusEffect(
    useCallback(() => {
      filterPatients(); // Reload patient data on every visit
    }, [patients])
  );

  const fetchPatients = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, you would fetch from your API
       const response = await fetch(API_ENDPOINTS.PATIENTS, {
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       const data = await response.json();

      // For demo purposes, using mock data
      const mockPatients = [
        {
          id: "1",
          name: "John Doe",
          age: 35,
          gender: "Male",
          image: "https://randomuser.me/api/portraits/men/32.jpg",
          status: "Current",
          lastVisit: "2023-05-15",
          diagnosis: "Anxiety Disorder",
        },
        {
          id: "2",
          name: "Jane Smith",
          age: 28,
          gender: "Female",
          image: "https://randomuser.me/api/portraits/women/44.jpg",
          status: "Current",
          lastVisit: "2023-05-10",
          diagnosis: "Depression",
        },
        {
          id: "3",
          name: "Robert Johnson",
          age: 42,
          gender: "Male",
          image: "https://randomuser.me/api/portraits/men/22.jpg",
          status: "Past",
          lastVisit: "2023-01-20",
          diagnosis: "PTSD",
        },
        {
          id: "4",
          name: "Emily Davis",
          age: 31,
          gender: "Female",
          image: "https://randomuser.me/api/portraits/women/28.jpg",
          status: "Current",
          lastVisit: "2023-05-05",
          diagnosis: "Bipolar Disorder",
        },
        {
          id: "5",
          name: "Michael Wilson",
          age: 45,
          gender: "Male",
          image: "https://randomuser.me/api/portraits/men/42.jpg",
          status: "Past",
          lastVisit: "2022-11-15",
          diagnosis: "Insomnia",
        },
        {
          id: "6",
          name: "Sarah Brown",
          age: 29,
          gender: "Female",
          image: "https://randomuser.me/api/portraits/women/65.jpg",
          status: "Current",
          lastVisit: "2023-05-01",
          diagnosis: "OCD",
        },
      ]
      console.log(data) 
  
 
    if(data == null) renderEmptyList()
    else{
      const patientArray = Object.values(data.patients);
      setPatients(patientArray);
    }

      
    } catch (err) {
      console.error("Error fetching patients:", err)
      setError("Failed to load patients. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterPatients = () => {
    let filtered = [...patients] // Create a copy to avoid mutation

    // Filter by status
    filtered = filtered.filter((patient) => patient.status === filter)

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredPatients(filtered)
  }

  const handlePatientPress = (patientId) => {
    navigation.navigate("PatientDetail", { patientId: patientId })
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
  }

  const renderPatientCard = ({ item, index }) => {
    // Create staggered animation for each card
    const itemFadeAnim = new Animated.Value(0)
    const itemTranslateAnim = new Animated.Value(50)

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
        <TouchableOpacity onPress={() => handlePatientPress(item._id)} activeOpacity={0.7}>
          <Card style={styles.card} key={item.id}>
            <Card.Content style={styles.cardContent}>
              <Avatar.Image
                source={{ uri: item.image }}
                size={60}
                style={styles.avatar}
                // Fallback in case image fails to load
                onError={() => console.log(`Failed to load image for ${item.name}`)}
              />
              {console.log(`${item._id}`)}
              <View style={styles.patientInfo}>
                <Title>{item.name}</Title>
                <Paragraph>
                  {item.age} years, {item.gender}
                </Paragraph>
                <View style={styles.diagnosisContainer}>
                  <Chip mode="outlined" style={styles.diagnosisChip} textStyle={{ fontSize: 12 }}>
                    {item.diagnosis}
                  </Chip>
                  <Text style={styles.lastVisit}>{"\n"} Last visit: {item.lastVisit=='1970-01-01'?'Not Yet': item.lastVisit}</Text>
                  
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} style={styles.arrowIcon} />
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people" size={60} color={theme.colors.disabled} />
      <Text style={styles.emptyText}>No patients found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? "Try adjusting your search" : `You don't have any ${filter.toLowerCase()} patients`}
      </Text>
      
    </View>
  )

  return (
    <View style={styles.container}>
       
        <Searchbar
          placeholder="Search patients..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === "Current" && styles.activeFilterButton]}
            onPress={() => handleFilterChange("Current")}
          >
            <Text style={[styles.filterText, filter === "Current" && styles.activeFilterText]}>Current</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === "Past" && styles.activeFilterButton]}
            onPress={() => handleFilterChange("Past")}
          >
            <Text style={[styles.filterText, filter === "Past" && styles.activeFilterText]}>Past</Text>
          </TouchableOpacity>
        </View>
      
      <Divider />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchPatients} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          
        />
      )}
      
    <FAB style={styles.fab} icon="plus" label="Add Patients" onPress={() => navigation.navigate('AddPatient')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchBar: {
    elevation: 2,
    marginBottom: 16,
    borderRadius: 8,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  filterText: {
    color: theme.colors.placeholder,
    fontWeight: "500",
  },
  activeFilterText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    backgroundColor: theme.colors.primary + "20",
  },
  patientInfo: {
    flex: 1,
    marginLeft: 16,
  },
  diagnosisContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  diagnosisChip: {
    height: 34,
    backgroundColor: `${theme.colors.primary}10`,
   
    marginBottom: 4,
  },
  lastVisit: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginLeft: 8,
  },
  arrowIcon: {
    marginLeft: 8,
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
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: theme.colors.placeholder,
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: "center",
    color: theme.colors.placeholder,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
})

export default PatientsScreen

