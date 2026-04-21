/**
 * Central route definitions for the app.
 *
 * Single source of truth for navigation targets. Avoids magic strings scattered
 * across auth flows, hooks, and guards.
 *
 * @author TutorConnect Team
 */

export type UserRole = 'LEARNER' | 'TUTOR';

export const ROUTES = {
  ROOT: '/',
  ONBOARDING: '/onboarding',

  // Auth
  AUTH_LOGIN: '/(auth)/login',
  AUTH_REGISTER: '/(auth)/register',
  AUTH_PROFILE_SETUP: '/(auth)/profile-setup',
  AUTH_TUTOR_REGISTER: '/(auth)/tutor-register',
  AUTH_TUTOR_CERTIFICATIONS: '/(auth)/tutor-certificaciones',
  AUTH_SOLICITUD_ENVIADA: '/(auth)/solicitud-enviada',

  // Learner area
  LEARNER_DASHBOARD: '/(learner)/dashboard',
  LEARNER_SEARCH: '/(learner)/search',
  LEARNER_PROFILE: '/(learner)/profile',

  // Tutor area
  TUTOR_DASHBOARD: '/(tutor)/dashboard',
  TUTOR_SESSIONS: '/(tutor)/sessions',
  TUTOR_PROFILE: '/(tutor)/profile',
} as const;

/**
 * Resolves the home route for a given user role.
 *
 * @param role - Platform role of the authenticated user.
 * @returns The route path the user should land on after authentication.
 * @example
 * router.replace(homeRouteForRole('TUTOR'));
 */
export function homeRouteForRole(role: UserRole): string {
  return role === 'TUTOR' ? ROUTES.TUTOR_DASHBOARD : ROUTES.LEARNER_DASHBOARD;
}
