import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { homeRouteForRole, ROUTES } from '@/constants/routes';
import { useProfile } from '@/hooks/use-profile';

/**
 * Root entry redirector.
 *
 * Two fixes applied here:
 *
 * 1. Navigation is imperative (not <Redirect>) guarded by `useIsFocused` so it
 *    only fires when this screen is the active route. Using <Redirect> would
 *    fire even when mounted in the background stack, which caused a race
 *    condition during tutor OAuth: index.tsx saw role=LEARNER (webhook default)
 *    and redirected before tutor-detalles.tsx could call POST /tutors/register.
 *
 * 2. Profile is refetched on every focus event so that role changes made by
 *    POST /tutors/register are reflected immediately instead of using stale
 *    cached data from before the registration completed.
 *
 * @author TutorConnect Team
 */
export default function Index() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refetch } = useProfile();

  // Refetch profile every time this screen gains focus so role updates from
  // registration flows are picked up before we decide where to redirect.
  useEffect(() => {
    if (isFocused && authLoaded && isSignedIn) {
      refetch();
    }
    // Only re-run when focus state changes — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  // Redirect once we have a stable, focused state.
  useEffect(() => {
    if (!isFocused) return;
    if (!authLoaded || (isSignedIn && profileLoading)) return;

    if (!isSignedIn) {
      router.replace(ROUTES.ONBOARDING);
      return;
    }

    if (profileError || !profile || !profile.role) {
      router.replace(ROUTES.ONBOARDING);
      return;
    }

    router.replace(homeRouteForRole(profile.role) as any);
  }, [isFocused, authLoaded, isSignedIn, profileLoading, profileError, profile, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#006A75" />
    </View>
  );
}
