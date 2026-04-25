import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

  if (Platform.OS === 'web') {
    return configuredUrl.replace('10.0.2.2', 'localhost');
  }

  if (Platform.OS === 'android') {
    return configuredUrl.replace('localhost', '10.0.2.2');
  }

  return configuredUrl;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // User endpoints
  usersCreate: `${API_BASE_URL}/users`,
  usersMe: `${API_BASE_URL}/users/me`,
  // Auth endpoints
  authMe: `${API_BASE_URL}/auth/me`,
  authLogout: `${API_BASE_URL}/auth/logout`,
  // Dashboard endpoints
  tutorDashboard: `${API_BASE_URL}/dashboard/tutor`,
  learnerDashboard: `${API_BASE_URL}/dashboard/learner`,
  // Tutor endpoints
  tutors: (subject?: string) =>
    subject
      ? `${API_BASE_URL}/tutors?subject=${encodeURIComponent(subject)}`
      : `${API_BASE_URL}/tutors`,
  tutorMe: `${API_BASE_URL}/tutors/me`,
  tutorRegister: `${API_BASE_URL}/tutors/register`,
  uploadCertification: (tutorId: string) =>
    `${API_BASE_URL}/tutors/${tutorId}/certificaciones`,
  deleteCertification: (certificationId: string) =>
    `${API_BASE_URL}/tutors/certifications/${certificationId}`,
};
