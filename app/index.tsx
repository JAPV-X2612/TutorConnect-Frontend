import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { homeRouteForRole, ROUTES } from '@/constants/routes';
import { useProfile } from '@/hooks/use-profile';

/**
 * Root entry redirector.
 *
 * Decision tree:
 * - Clerk not loaded → spinner
 * - Not signed in → `/onboarding`
 * - Signed in, profile loading → spinner
 * - Signed in, no backend profile → `/(auth)/profile-setup`
 * - Signed in, profile resolved → role-specific home
 *
 * All post-authentication flows (login, OAuth callback, email verification,
 * learner sign-up) redirect here so that role-based routing lives in a
 * single place.
 *
 * @author TutorConnect Team
 */
export default function Index() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfile();

  if (!authLoaded || (isSignedIn && profileLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#006A75" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href={ROUTES.ONBOARDING} />;
  }

  if (profileError || !profile) {
    return <Redirect href={ROUTES.AUTH_PROFILE_SETUP} />;
  }

  return <Redirect href={homeRouteForRole(profile.role)} />;
}
