"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Dimensions,
} from "react-native"
import { Text, TextInput, Avatar, Surface, Title, Divider } from "react-native-paper"
import theme from "../../config/theme"
import { useAuth } from "../../context/AuthContext"

const { width, height } = Dimensions.get("window")

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const flatListRef = useRef(null)
  const inputRef = useRef(null)
  const { user } = useAuth()

  // Animation values
  const fadeAnim = new Animated.Value(0)
  const translateAnim = new Animated.Value(50)

  useEffect(() => {
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

    // Add initial welcome message
    setMessages([
      {
        id: "1",
        text: "Hello! I'm your virtual assistant. How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ])

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true)
      scrollToBottom()
    })
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false)
    })

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true })
    }
  }

  // Memoize the send handler to prevent unnecessary re-renders
  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    // Clear input before adding message to prevent flickering
    const currentText = inputText
    setInputText("")

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      // In a real app, you would call your API
      // const response = await fetch(API_ENDPOINTS.CHAT, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ message: userMessage.text }),
      // });
      // const data = await response.json();

      // Simulate API delay
      setTimeout(() => {
        // Mock response based on user input
        let botResponse = "I'm not sure how to respond to that. Can you please clarify?"

        if (currentText.toLowerCase().includes("hello") || currentText.toLowerCase().includes("hi")) {
          botResponse = "Hello! How can I assist you today?"
        } else if (currentText.toLowerCase().includes("appointment")) {
          botResponse = "Would you like to schedule a new appointment or check your existing appointments?"
        } else if (currentText.toLowerCase().includes("schedule") || currentText.toLowerCase().includes("book")) {
          botResponse =
            "To schedule an appointment, please provide your preferred date and time, and I'll check availability."
        } else if (currentText.toLowerCase().includes("cancel")) {
          botResponse =
            "If you need to cancel an appointment, please provide the date and time, and I'll help you with that."
        } else if (currentText.toLowerCase().includes("patient") || currentText.toLowerCase().includes("client")) {
          botResponse =
            "You can view all your patients in the Patients tab. Would you like me to help you find a specific patient?"
        } else if (currentText.toLowerCase().includes("thank")) {
          botResponse = "You're welcome! Is there anything else I can help you with?"
        }

        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: "bot",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, botMessage])
        setIsTyping(false)
      }, 1500)
    } catch (error) {
      console.error("Error sending message:", error)

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
        isError: true,
      }

      setMessages((prev) => [...prev, errorMessage])
      setIsTyping(false)
    }
  }, [inputText])

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === "user"
    const showAvatar = !isUser && (index === 0 || messages[index - 1].sender !== "bot")

    // Create staggered animation for each message
    const itemFadeAnim = new Animated.Value(0)
    const itemTranslateAnim = new Animated.Value(isUser ? 20 : -20)

    Animated.parallel([
      Animated.timing(itemFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(itemTranslateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    return (
      <Animated.View
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.botMessageRow,
          {
           // opacity: itemFadeAnim,
           // transform: [{ translateX: itemTranslateAnim }],
          },
        ]}
      >
        {!isUser && showAvatar ? (
          <Avatar.Image
            source={{ uri: "https://randomuser.me/api/portraits/lego/1.jpg" }}
            size={36}
            style={styles.avatar}
          />
        ) : !isUser ? (
          <View style={styles.avatarSpacer} />
        ) : null}

        <Surface
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
            item.isError && styles.errorBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.botMessageText,
              item.isError && styles.errorText,
            ]}
          >
            {item.text}
          </Text>
          <Text style={styles.timestamp}>{formatTime(new Date(item.timestamp))}</Text>
        </Surface>
      </Animated.View>
    )
  }

  const renderTypingIndicator = () => {
    if (!isTyping) return null

    return (
      <View style={[styles.messageRow, styles.botMessageRow]}>
        <Avatar.Image
          source={{ uri: "https://randomuser.me/api/portraits/lego/1.jpg" }}
          size={36}
          style={styles.avatar}
        />
        <Surface style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </Surface>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      
      
      <Divider />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        ListFooterComponent={renderTypingIndicator}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
      />

      <Surface style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          style={styles.input}
          multiline
          maxHeight={100}
          blurOnSubmit={false}
          right={
            <TextInput.Icon
              icon="send"
              color={inputText.trim() ? theme.colors.primary : theme.colors.disabled}
              onPress={handleSend}
              disabled={!inputText.trim()}
            />
          }
        />
      </Surface>
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: theme.colors.placeholder,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  botMessageRow: {
    justifyContent: "flex-start",
  },
  avatar: {
    marginRight: 8,
    backgroundColor: theme.colors.primary,
  },
  avatarSpacer: {
    width: 44, // Avatar width + margin
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: "75%",
    elevation: 1,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: `${theme.colors.error}20`,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userMessageText: {
    color: "white",
  },
  botMessageText: {
    color: theme.colors.text,
  },
  errorText: {
    color: theme.colors.error,
  },
  timestamp: {
    fontSize: 10,
    alignSelf: "flex-end",
    opacity: 0.7,
    color: "#ccc",
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 20,
    width: 40,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.placeholder,
    marginHorizontal: 2,
    opacity: 0.7,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.disabled + "30",
    backgroundColor: theme.colors.surface,
  },
  input: {
    backgroundColor: theme.colors.background,
  },
})

export default ChatbotScreen

