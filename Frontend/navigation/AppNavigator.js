import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from "@react-navigation/native"

// Import screens
import LandingScreen from "../screens/LandingScreen"
import UserTypeSelectionScreen from "../screens/UserTypeSelectionScreen"

// Import client screens
import ClientAuthOptionsScreen from "../screens/client/ClientAuthOptionsScreen"
import ClientLoginScreen from "../screens/client/ClientLoginScreen"
import ClientQRScannerScreen from "../screens/client/ClientQRScannerScreen"
import ClientSetPasswordScreen from "../screens/client/ClientSetPasswordScreen"

// Import doctor screens
import LoginScreen from "../screens/auth/LoginScreen"

// Import navigators
// import DoctorNavigator from "./DoctorNavigator"
//import PatientNavigator from "./PatientNavigator"

const Stack = createStackNavigator()

const AppNavigator2 = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Onboarding Screens */}
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />

        {/* Client Authentication Screens */}
        <Stack.Screen name="ClientAuthOptions" component={ClientAuthOptionsScreen} />
        <Stack.Screen name="ClientLogin" component={ClientLoginScreen} />
        <Stack.Screen name="ClientQRScanner" component={ClientQRScannerScreen} />
        <Stack.Screen name="ClientSetPassword" component={ClientSetPasswordScreen} />

        {/* Doctor Authentication Screens */}
        <Stack.Screen name="LoginScreen" component={LoginScreen} />

        {/* Main App Navigators  <Stack.Screen name="DoctorNavigator" component={DoctorNavigator} /> <Stack.Screen name="PatientTabs" component={PatientNavigator} />*/}
       
        
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator2

