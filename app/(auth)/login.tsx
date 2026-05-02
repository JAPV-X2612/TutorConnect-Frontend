import { Ionicons } from '@expo/vector-icons';
import { useAuth, useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BannerError = 'network' | 'generic';

const BANNER_MESSAGES: Record<BannerError, string> = {
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo.',
  generic: 'No pudimos conectar con Google. Intenta de nuevo.',
};

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [bannerError, setBannerError] = useState<BannerError | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect immediately if there is already an active session; index handles role routing.
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn]);

  const handleGoogleSignIn = async () => {
    setBannerError(null);
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('/oauth-native-callback');
      const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED' || err?.message?.includes('cancel')) return;

      // Session already active — user is signed in, go to tabs.
      if (err?.errors?.[0]?.code === 'session_exists') {
        router.replace('/');
        return;
      }

      setBannerError(!err?.errors ? 'network' : 'generic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center">
        <Text className="text-3xl font-bold text-text-primary mb-2">Iniciar sesión</Text>
        <Text className="text-base text-text-muted mb-10">
          Accede a tu cuenta con Google.
        </Text>

        {bannerError && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
            <Text className="text-red-700 text-sm">{BANNER_MESSAGES[bannerError]}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleGoogleSignIn}
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
        <Text className="text-sm text-text-muted">¿No tienes cuenta? </Text>
        <TouchableOpacity onPress={() => router.push('/onboarding')}>
          <Text className="text-sm text-text-link font-semibold">Regístrate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
