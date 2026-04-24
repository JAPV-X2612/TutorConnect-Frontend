import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function OAuthNativeCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;

    const role = user?.publicMetadata?.role as string | undefined;
    if (role === 'TUTOR') {
      router.replace('/(tutor)/dashboard');
    } else if (role === 'LEARNER') {
      router.replace('/(tabs)');
    } else {
      // Brand-new user (no role assigned yet) — send to tutor registration to complete profile.
      router.replace('/(auth)/tutor-register' as any);
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
