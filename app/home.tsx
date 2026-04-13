import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { useApiRequest } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

interface UserData {
  id: string;
  email: string;
  rol: string;
  created_at: string;
}

export default function HomeScreen() {
  const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();
  const api = useApiRequest();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await api.get<UserData>(API_ENDPOINTS.usersMe);
      if (result.error) {
        setError('No se pudo cargar tu información. Intenta de nuevo.');
      } else {
        setUserData(result.data ?? null);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

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
    <SafeAreaView className="flex-1 bg-background px-6 justify-center">
      <Text className="text-3xl font-bold text-text-primary mb-2">Hola, {name}</Text>
      <Text className="text-base text-text-muted">{userData?.email}</Text>
    </SafeAreaView>
  );
}
