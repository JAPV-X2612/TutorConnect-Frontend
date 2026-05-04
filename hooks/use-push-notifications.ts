import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { API_ENDPOINTS } from '@/constants/api';
import { useApiRequest } from '@/services/api';

/**
 * Registers the device FCM token with the backend and handles deep-linking
 * when the user taps a push notification from outside the app.
 *
 * Uses dynamic import for expo-notifications so the module is NEVER loaded
 * at import-time in Expo Go SDK 53+, where the package throws on initialization.
 * All push features require a development build on a physical Android device.
 *
 * @author Camilo Quintero, Jesús Pinzón, Laura Rodríguez, Santiago Díaz, Sergio Bejarano
 * @version 1.1
 * @since 2026-05-03
 */

type Router = { push: (href: any) => void };

function isDevBuild(): boolean {
  // 'storeClient' = Expo Go. Push notifications require a real dev/production build.
  return (
    Device.isDevice &&
    Constants.executionEnvironment !== 'storeClient'
  );
}

export function usePushNotifications({ router }: { router: Router }): void {
  const api = useApiRequest();

  useEffect(() => {
    if (!isDevBuild()) return;
    void setupNotifications(api, router);
  }, []);
}

async function setupNotifications(
  api: ReturnType<typeof useApiRequest>,
  router: Router,
): Promise<void> {
  try {
    // Dynamic import keeps expo-notifications out of the module graph at load time.
    const Notifications = await import('expo-notifications');

    // Suppress foreground alerts — WebSocket handles in-app real-time updates.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    // Deep-link when the user taps a background/killed notification.
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) {
      const data = lastResponse.notification.request.content.data as {
        type?: string;
        channelId?: string;
      };
      if (data.type === 'message') {
        router.push('/(learner)/mensajes' as any);
      } else if (data.type === 'booking') {
        router.push('/(learner)/sessions' as any);
      }
    }

    await registerToken(api, Notifications);
  } catch {
    // expo-notifications unavailable in this environment — silent fail.
  }
}

async function registerToken(
  api: ReturnType<typeof useApiRequest>,
  Notifications: typeof import('expo-notifications'),
): Promise<void> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TutorConnect',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#006A75',
    });
  }

  // getDevicePushTokenAsync returns the native FCM token on Android.
  // Requires google-services.json in the project root.
  const { data: fcmToken } = await Notifications.getDevicePushTokenAsync();
  if (fcmToken) {
    await api.patch(API_ENDPOINTS.registerFcmToken, { fcmToken });
  }
}
