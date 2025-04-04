// API configuration
const API_BASE_URL = 'http://10.16.50.27:5000';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  PATIENTS: `${API_BASE_URL}/patients`,
  PATIENT_DETAIL: (id) => `${API_BASE_URL}/patients/${id}`,
  APPOINTMENTS: `${API_BASE_URL}/appointments`,
  CHAT: `${API_BASE_URL}/chat`,
  PROFILE: `${API_BASE_URL}/auth/profile`,
  //VIDEOS: `${API_BASE_URL}/videos`,
  UPLOAD_VIDEO:(id) => `${API_BASE_URL}/patient/${id}/videos/upload`,
  ADD_NOTE: (session_id) => `${API_BASE_URL}/patients/${session_id}/AddNote`,
  DOCUMENTS: `${API_BASE_URL}/documents`,
  CLIENTREGISTER: `${API_BASE_URL}/auth/clientregister`,
  CLIENTLOGIN: `${API_BASE_URL}/auth/clientlogin`,
  CLIENTPROFILE: `${API_BASE_URL}/auth/clientprofile`,
  CLIENTAPPOINTMENTS: `${API_BASE_URL}/clientappointments`,
  PATIENT_MEDICATIONS: (id) => `${API_BASE_URL}/getMedicine/${id}`,
  MEDICATIONS: `${API_BASE_URL}/editMedicine`, 
  GENERATE_REPORT: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/generate-report`,
  CHECK_REPORT: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/report`,
  GENERATE_INSIGHTS: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/generate-insights`,
  CHECK_INSIGHTS: (sessionId) => `${API_BASE_URL}/sessions/${sessionId}/insights`,// passing the medicine id not the _id straight from the frontend page
};

export default API_ENDPOINTS;