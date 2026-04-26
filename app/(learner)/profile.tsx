import { ProfileScreen } from '@/components/shared/profile-screen';

/**
 * Learner profile tab.
 *
 * Currently a thin wrapper around the shared {@link ProfileScreen}. Kept as
 * a dedicated file so learner-specific sections can be added here without
 * touching the tutor variant.
 *
 * @author TutorConnect Team
 */
export default function LearnerProfileScreen() {
  return <ProfileScreen />;
}
