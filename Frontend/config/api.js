// API configuration
const API_BASE_URL = 'http://10.16.50.27:5000';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  PATIENTS: `${API_BASE_URL}/patients`,
  PATIENT_DETAIL: (id) => `${API_BASE_URL}/patients/${id}`,
  APPOINTMENTS: `${API_BASE_URL}/appointments`,
  CHAT: `${API_BASE_URL}/chat`,
  PROFILE: `${API_BASE_URL}/profile`,
  VIDEOS: `${API_BASE_URL}/videos`,
  UPLOAD_VIDEO: `${API_BASE_URL}/videos/upload`,
  DOCUMENTS: `${API_BASE_URL}/documents`,
};

export default API_ENDPOINTS;