import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * Clerk OAuth completion handler.
 *
 * Routing decisions live exclusively in `app/index.tsx` — this screen simply
 * redirects there once the Clerk session is established so role resolution
 * happens in a single place.
 *
 * @author TutorConnect Team
 */
export default function OAuthNativeCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
