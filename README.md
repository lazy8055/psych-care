# 🧠 Psycare – AI-Powered Platform for Psychologists & Patients

Psycare is a secure, AI-enabled patient management and session analysis platform tailored for psychologists. It facilitates appointment booking, emotion-aware report generation from therapy sessions, medicine/exercise reminders, and chatbot assistance. It focuses on **data privacy**, **human-centered onboarding**, and **AI-driven insights** to support mental health care.

---

## 🎯 Problem Statement

Traditional therapy management tools often lack automation, data-driven insights, and secure onboarding flows. This creates friction in managing sessions, extracting emotional patterns, and securely storing sensitive patient data.

---

## ✅ Solution

Psycare bridges this gap by integrating:
- **Multimodal emotion detection** using video (DeepFace) and audio (AssemblyAI),
- **LLM-based report generation** with Gemini,
- **QR-based secure onboarding** for patients,
- A complete mobile-first experience for both doctors and patients.

---

## 🧩 Features

### 👨‍⚕️ Doctor Portal
- Register with document verification
- View current and past patients
- Upload session videos
- Auto-generate session reports with Gemini (LLM)
- Generate emotion-over-time graphs from DeepFace & AssemblyAI
- Prescribe medicine, exercises, and reminders
- Manage appointments

### 🧍 Patient Portal
- Secure QR-based account setup via doctor
- First-time password setup from QR code
- Login with email and password
- View personal records, prescriptions, and exercises
- Book appointments
- Use AI chatbot (Gemini) for FAQs and support

---

## 🧠 AI Features

| Task | Model / Tool |
|------|--------------|
| Audio Emotion Detection | AssemblyAI |
| Audio Transcript & Report Generation | Gemini |
| Facial Emotion Detection | DeepFace |
| Triple-Validation of LLM Output | Custom scoring mechanism |
| Chatbot Assistant | Gemini |

---

## 🔐 Security & Onboarding Flow

- Patients cannot sign up directly.
- Doctors create accounts → generates unique MongoDB ID → converts to 24-char hex → embedded in QR code.
- Patients scan the QR → set password → gain access.
- JWT tokens used for secure API access.
- Role-based access control ensures strict data privacy.

---

## 🛠️ Tech Stack

| Layer       | Technologies |
|-------------|--------------|
| Frontend    | React Native, Tailwind CSS |
| Backend     | Flask (Python), JWT |
| Database    | MongoDB |
| AI Services | AssemblyAI, DeepFace, Gemini |
| Cloud/Infra | AWS S3 (video storage), QR Code Generation |
| Security    | JWT, RBAC |

---

## 🏗️ System Architecture (Simplified)

![image](https://github.com/user-attachments/assets/51963749-fa07-45a3-a977-255ceda1693b)

---

## Project Structure
```
📦 
├─ .gitignore
├─ Backend2
│  ├─ backend.
│  ├─ qrcode.png
│  └─ test.py
├─ Frontend
│  ├─ App.js
│  ├─ app.json
│  ├─ assets
│  │  ├─ adaptive-icon.png
│  │  ├─ default-avatar.png
│  │  ├─ favicon.png
│  │  ├─ icon.png
│  │  ├─ logo.avif
│  │  └─ splash-icon.png
│  ├─ config
│  │  ├─ api.js
│  │  └─ theme.js
│  ├─ context
│  │  ├─ AuthContext.js
│  │  └─ ClientAuthContext.js
│  ├─ index.js
│  ├─ navigation
│  │  └─ AppNavigator.js
│  ├─ package.json
│  └─ screens
│     ├─ LandingScreen.js
│     ├─ UserTypeSelectionScreen.js
│     ├─ auth
│     │  ├─ LoginScreen.js
│     │  └─ RegisterScreen.js
│     ├─ client
│     │  ├─ AppointmentScreen.js
│     │  ├─ ClientAuthOptionsScreen.js
│     │  ├─ ClientBot.js
│     │  ├─ ClientLoginScreen.js
│     │  ├─ ClientProfile.js
│     │  ├─ ClientProfileScreen.js
│     │  └─ ClientRegisterScreen.js
│     └─ main
│        ├─ AddPatientScreen.js
│        ├─ AddVideoScreen.js
│        ├─ CalendarScreen.js
│        ├─ ChatbotScreen.js
│        ├─ MedicationManagementScreen.js
│        ├─ PatientDetailScreen.js
│        ├─ PatientsScreen.js
│        ├─ ProfileScreen.js
│        └─ VideoPlayerScreen.js
├─ package-lock.json
└─ package.json
```

