import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

type ResolvedRole = 'TUTOR' | 'LEARNER' | 'NONE';

/**
 * Root entry point. Resolves the authenticated user's role and redirects
 * to the correct dashboard. Falls back to querying the backend when
 * Clerk's publicMetadata has not been populated by the server yet.
 */
export default function Index() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const api = useApiRequest();
  const [resolvedRole, setResolvedRole] = useState<ResolvedRole | null>(null);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    if (!isSignedIn) {
      setResolvedRole('NONE');
      return;
    }

    // Fast path: role already present in Clerk publicMetadata.
    const metaRole = user?.publicMetadata?.role as string | undefined;
    if (metaRole === 'TUTOR' || metaRole === 'LEARNER') {
      setResolvedRole(metaRole);
      return;
    }

    // Slow path: publicMetadata not set — query the backend for the authoritative role.
    let cancelled = false;
    const fetchRole = async () => {
      const result = await api.get<{ role: 'TUTOR' | 'LEARNER' }>(API_ENDPOINTS.usersMe);
      if (cancelled) return;
      setResolvedRole(result.data?.role ?? 'NONE');
    };
    fetchRole();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, userLoaded, isSignedIn]);

  if (resolvedRole === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#006A75" />
      </View>
    );
  }

  if (resolvedRole === 'TUTOR') return <Redirect href="/(tutor)/dashboard" />;
  if (resolvedRole === 'LEARNER') return <Redirect href="/(tabs)" />;
  return <Redirect href="/onboarding" />;
}
