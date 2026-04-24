import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import { useSessionGuard } from '@/hooks/useSessionGuard';

interface UserData {
  id: string;
  email: string;
  rol: string;
  created_at: string;
}

export default function HomeScreen() {
  const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { get, post } = useApiRequest();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Valida la sesión contra el backend; redirige a onboarding si expiró
  useSessionGuard();

  useEffect(() => {
    const fetchUser = async () => {
      const result = await get<UserData>(API_ENDPOINTS.usersMe);
      if (result.error) {
        setError('No se pudo cargar tu información. Intenta de nuevo.');
      } else {
        setUserData(result.data ?? null);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await post(API_ENDPOINTS.authLogout);
    } finally {
      // Siempre limpiar la sesión local aunque el backend falle
      await signOut();
      router.replace('/onboarding');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-red-600 text-center text-base">{error}</Text>
      </SafeAreaView>
    );
  }

  const name =
    isClerkUserLoaded && clerkUser
      ? (clerkUser.fullName ?? clerkUser.firstName ?? 'Usuario')
      : 'Usuario';

  return (
    <SafeAreaView className="flex-1 bg-background px-6 justify-between py-10">
      <View className="flex-1 justify-center">
        <Text className="text-3xl font-bold text-text-primary mb-2">Hola, {name}</Text>
        <Text className="text-base text-text-muted">{userData?.email}</Text>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        disabled={loggingOut}
        activeOpacity={0.85}
        className="border border-red-300 rounded-full py-4 items-center"
      >
        <Text className="text-base font-semibold text-red-500">
          {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}