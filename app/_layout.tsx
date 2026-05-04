import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export const unstable_settings = {
  anchor: 'onboarding',
};

export default function RootLayout() {
  const router = useRouter();

  // Registers the FCM device token with the backend on every launch.
  // All expo-notifications calls use dynamic import inside the hook so the
  // module is never loaded at import-time in Expo Go SDK 53+, where it throws.
  usePushNotifications({ router });

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      {...({ navigate: (to: string) => router.push(to as any) } as any)}
    >
      <ClerkLoaded>
        <ThemeProvider value={DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(learner)" options={{ headerShown: false }} />
            <Stack.Screen name="(tutor)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="oauth-native-callback"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', title: 'Modal' }}
            />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
