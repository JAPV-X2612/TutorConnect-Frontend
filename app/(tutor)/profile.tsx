import ProfileScreen from '@/src/screens/ProfileScreen';

/**
 * Tutor profile tab.
 *
 * Thin wrapper around the shared {@link ProfileScreen}. Kept as a dedicated
 * file so tutor-specific sections can be added here without touching the
 * learner variant.
 *
 * @author TutorConnect Team
 */
export default function TutorProfileScreen() {
  return <ProfileScreen />;
}
