import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClerk, useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';

type BannerError = 'network' | 'generic';

const BANNER_MESSAGES: Record<BannerError, string> = {
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo.',
  generic: 'No pudimos conectar con Google. Intenta de nuevo.',
};

export default function RegisterScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const clerk = useClerk();
  const api = useApiRequest();
  const router = useRouter();
  const [bannerError, setBannerError] = useState<BannerError | null>(null);
  const [loading, setLoading] = useState(false);

  const syncUserWithBackend = async () => {
    const clerkId = clerk.user?.id;
    const email = clerk.user?.primaryEmailAddress?.emailAddress;
    if (!clerkId || !email) return;

    // 201 = created, 409 = already exists — both are acceptable; other errors are non-blocking
    await api.post(API_ENDPOINTS.usersCreate, {
      clerkId,
      email,
      role: 'APRENDIZ',
    });
  };

  const handleGoogleSignUp = async () => {
    setBannerError(null);
    setLoading(true);
    try {
      const { createdSessionId, signUp, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        await syncUserWithBackend();
        router.replace('/home');
      } else if (signUp?.status === 'missing_requirements') {
        router.push('/(auth)/profile-setup' as any);
      }
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED' || err?.message?.includes('cancel')) return;
      if (!err?.errors) {
        setBannerError('network');
      } else {
        setBannerError('generic');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center">
        <Text className="text-3xl font-bold text-text-primary mb-2">Crear cuenta</Text>
        <Text className="text-base text-text-muted mb-10">
          Empieza gratis con tu cuenta de Google.
        </Text>

        {bannerError && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
            <Text className="text-red-700 text-sm">{BANNER_MESSAGES[bannerError]}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleGoogleSignUp}
          disabled={loading}
          activeOpacity={0.85}
          className="flex-row items-center justify-center gap-3 bg-white border border-border rounded-full py-4 shadow-sm"
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text className="text-base font-semibold text-text-primary">
            {loading ? 'Conectando...' : 'Continuar con Google'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 pb-10 flex-row justify-center">
        <Text className="text-sm text-text-muted">¿Ya tienes cuenta? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
          <Text className="text-sm text-text-link font-semibold">Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
