import { ProfileScreen } from '@/components/shared/profile-screen';

/**
 * Tutor profile tab.
 *
 * Currently a thin wrapper around the shared {@link ProfileScreen}. Kept as
 * a dedicated file so tutor-specific sections (e.g. certifications summary,
 * hourly rate, availability toggle) can be added here without touching the
 * learner variant.
 *
 * @author TutorConnect Team
 */
export default function TutorProfileScreen() {
  return <ProfileScreen />;
}
