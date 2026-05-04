import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { API_ENDPOINTS } from '@/constants/api';
import { useApiRequest } from '@/services/api';

/**
 * Requests push notification permissions, obtains the FCM device token, and
 * registers it with the backend on every app launch.
 *
 * - No-ops silently on simulators/emulators (FCM requires a physical device).
 * - If the user denies permissions, the hook exits without error.
 * - Token registration failure is swallowed — it must not crash the app.
 *
 * @author Camilo Quintero, Jesús Pinzón, Laura Rodríguez, Santiago Díaz, Sergio Bejarano
 * @version 1.0
 * @since 2026-05-03
 */
export function usePushNotifications(): void {
  const api = useApiRequest();

  useEffect(() => {
    void registerDevice(api);
  }, []);
}

async function registerDevice(
  api: ReturnType<typeof useApiRequest>,
): Promise<void> {
  // FCM push tokens only work on real devices.
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  // Android requires an explicit notification channel.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TutorConnect',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#006A75',
    });
  }

  try {
    // getDevicePushTokenAsync returns the native FCM token on Android.
    // Requires google-services.json to be present in the project root.
    const { data: fcmToken } = await Notifications.getDevicePushTokenAsync();
    if (fcmToken) {
      await api.patch(API_ENDPOINTS.registerFcmToken, { fcmToken });
    }
  } catch {
    // Fails when google-services.json is missing or in emulator — silent fail.
  }
}
