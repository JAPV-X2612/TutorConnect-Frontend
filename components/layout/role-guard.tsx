import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import type { ReactNode } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { homeRouteForRole, ROUTES, UserRole } from '@/constants/routes';

/**
 * Route guard that enforces role-based access to a route group.
 *
 * Behaviour:
 * - While the profile is loading, renders a centred spinner.
 * - If the profile cannot be resolved, redirects to onboarding.
 * - If the authenticated user's role differs from `expected`, redirects to
 *   the home route of the user's actual role.
 * - Otherwise, renders `children`.
 *
 * Use this HOC-style component at the top of each `_layout.tsx` inside a
 * role-specific route group (e.g. `app/(learner)/_layout.tsx`).
 *
 * @param expected - Role required to access the wrapped routes.
 * @param children - Route content to render when access is granted.
 *
 * @author TutorConnect Team
 */
export function RoleGuard({
  expected,
  children,
}: Readonly<{ expected: UserRole; children: ReactNode }>) {
  const { profile, loading, error } = useProfile();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#006A75" />
      </View>
    );
  }

  if (error || !profile) {
    return <Redirect href={ROUTES.ONBOARDING} />;
  }

  // Defensive: if the backend omits the role field, fall back to onboarding
  // so the user can complete the proper role-specific registration. Avoids
  // looping back to the default home which would re-enter this same guard.
  if (!profile.role) {
    return <Redirect href={ROUTES.ONBOARDING} />;
  }

  if (profile.role !== expected) {
    return <Redirect href={homeRouteForRole(profile.role) as any} />;
  }

  return <>{children}</>;
}
