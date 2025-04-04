"use client"

import { useEffect, useRef } from "react"
import { View, StyleSheet, Image, Animated, Dimensions, TouchableOpacity } from "react-native"
import { Text, Button, Surface, Title, Paragraph } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import theme from "../../config/theme"

const { width, height } = Dimensions.get("window")

const ClientAuthOptionsScreen = () => {
  const navigation = useNavigation()

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const loginCardAnim = useRef(new Animated.Value(100)).current
  const registerCardAnim = useRef(new Animated.Value(100)).current

  useEffect(() => {
    // Start animations
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.stagger(200, [
        Animated.timing(loginCardAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(registerCardAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [])

  const handleLoginOption = () => {
    navigation.navigate("ClientLogin")
  }

  const handleRegisterOption = () => {
    navigation.navigate("ClientRegister")
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, "#8A2BE2"]}
        style={styles.headerBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Image source={require("../../assets/logo.avif")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.headerTitle}>Client Access</Text>
        <Text style={styles.headerSubtitle}>Choose how you want to access your therapy account</Text>
      </Animated.View>

      <View style={styles.cardsContainer}>
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: loginCardAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={handleLoginOption}>
            <Surface style={styles.card}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="log-in" size={40} color={theme.colors.primary} />
              </View>
              <Title style={styles.cardTitle}>Already Registered</Title>
              <Paragraph style={styles.cardDescription}>
                Sign in with your email and password if you've already been registered by your therapist
              </Paragraph>
              <View style={styles.cardFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Use your email address</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Enter your password</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Secure access to your account</Text>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={handleLoginOption}
                style={styles.cardButton}
                contentStyle={styles.buttonContent}
              >
                Sign In
              </Button>
            </Surface>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: registerCardAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={handleRegisterOption}>
            <Surface style={styles.card}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="qr-code" size={40} color={theme.colors.primary} />
              </View>
              <Title style={styles.cardTitle}>Register with Therapist</Title>
              <Paragraph style={styles.cardDescription}>
                Scan the QR code provided by your therapist to register your account
              </Paragraph>
              <View style={styles.cardFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="scan-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Scan QR code from therapist</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Create your password</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="person-add-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.featureText}>Complete your profile</Text>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={handleRegisterOption}
                style={styles.cardButton}
                contentStyle={styles.buttonContent}
              >
                Scan QR Code
              </Button>
            </Surface>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Button mode="text" onPress={() => navigation.goBack()} color="white" icon="arrow-left">
          Back
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 220,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: "white",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  },
  cardIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  cardDescription: {
    color: theme.colors.placeholder,
    marginBottom: 16,
  },
  cardFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 10,
    color: theme.colors.text,
  },
  cardButton: {
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
})

export default ClientAuthOptionsScreen

