import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

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
  usersMeUpdate: `${API_BASE_URL}/users/me`,
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
  courseListings: (subject?: string) =>
    subject
      ? `${API_BASE_URL}/tutors/courses?subject=${encodeURIComponent(subject)}`
      : `${API_BASE_URL}/tutors/courses`,
  courseDetail: (courseId: string) => `${API_BASE_URL}/tutors/courses/${courseId}`,
  tutorRegister: `${API_BASE_URL}/tutors/register`,
  tutorMe: `${API_BASE_URL}/tutors/me`,
  tutorCourses: `${API_BASE_URL}/tutors/me/courses`,
  tutorCourse: (courseId: string) => `${API_BASE_URL}/tutors/me/courses/${courseId}`,
  uploadCertification: (tutorId: string) =>
    `${API_BASE_URL}/tutors/${tutorId}/certificaciones`,
  deleteCertification: (tutorId: string, certificationId: string) =>
    `${API_BASE_URL}/tutors/${tutorId}/certificaciones/${certificationId}`,
  // Booking endpoints
  bookings: `${API_BASE_URL}/bookings`,
  myBookings: `${API_BASE_URL}/bookings/me`,
  tutorBookings: `${API_BASE_URL}/bookings/tutor`,
  bookingStatus: (bookingId: string) => `${API_BASE_URL}/bookings/${bookingId}/status`,
  cancelBooking: (bookingId: string) => `${API_BASE_URL}/bookings/${bookingId}/cancel`,
  // Search endpoints
  searchCourses: (q: string, limit = 10) =>
    `${API_BASE_URL}/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  searchRecommendations: (limit = 10) =>
    `${API_BASE_URL}/search/recommendations?limit=${limit}`,
  // Messaging endpoints
  messagingChannels: `${API_BASE_URL}/messaging/channels`,
  messagingMessages: (channelId: number) =>
    `${API_BASE_URL}/messaging/channels/${channelId}/messages`,
};
