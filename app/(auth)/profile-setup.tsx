import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClerk, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useApiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';

type BannerError = 'network' | 'generic';

const BANNER_MESSAGES: Record<BannerError, string> = {
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo.',
  generic: 'Ocurrió un error. Intenta de nuevo.',
};

export default function ProfileSetupScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const api = useApiRequest();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<BannerError | null>(null);

  const nombreError = submitted && nombre.trim().length < 2 ? 'Ingresa tu nombre completo' : null;
  const telefonoError =
    submitted && telefono.length > 0 && telefono.replace(/\D/g, '').length < 7
      ? 'Ingresa un teléfono válido'
      : null;
  const isValid = nombre.trim().length >= 2;

  const handleSave = async () => {
    setSubmitted(true);
    setBannerError(null);
    if (!isValid || !isLoaded || !signUp) return;

    setLoading(true);
    try {
      const parts = nombre.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');

      await signUp.update({ firstName, lastName });

      if (signUp.status === 'complete') {
        await setActive!({ session: signUp.createdSessionId });

        const clerkId = clerk.user?.id;
        const email = clerk.user?.primaryEmailAddress?.emailAddress;
        if (clerkId && email) {
          await api.post(API_ENDPOINTS.usersCreate, {
            clerkId,
            email,
            firstName,
            lastName,
            role: 'LEARNER',
          });
          // 201 = created, 409 = already exists — both are acceptable
        }

        router.replace('/(tabs)');
      }
    } catch (err: any) {
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
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-6 justify-center">
          <Text className="text-3xl font-bold text-text-primary mb-2">Completa tu perfil</Text>
          <Text className="text-base text-text-muted mb-10">
            Cuéntanos un poco sobre ti para personalizar tu experiencia.
          </Text>

          {bannerError && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              <Text className="text-red-700 text-sm">{BANNER_MESSAGES[bannerError]}</Text>
            </View>
          )}

          <View className="mb-5">
            <TextInput
              className={`bg-white border rounded-xl px-4 py-3.5 text-base text-text-primary ${
                nombreError ? 'border-red-400' : 'border-border'
              }`}
              placeholder="Tu nombre"
              autoCapitalize="words"
              autoCorrect={false}
              value={nombre}
              onChangeText={setNombre}
            />
            {nombreError && (
              <Text className="text-red-500 text-xs mt-1 ml-1">{nombreError}</Text>
            )}
          </View>

          <View className="mb-8">
            <TextInput
              className={`bg-white border rounded-xl px-4 py-3.5 text-base text-text-primary ${
                telefonoError ? 'border-red-400' : 'border-border'
              }`}
              placeholder="+57 300 000 0000"
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={setTelefono}
            />
            {telefonoError && (
              <Text className="text-red-500 text-xs mt-1 ml-1">{telefonoError}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
            className={`rounded-full py-4 items-center ${isValid ? 'bg-primary' : 'bg-secondary opacity-40'}`}
          >
            <Text className={`text-base font-semibold ${isValid ? 'text-primary-foreground' : 'text-text-muted'}`}>
              {loading ? 'Guardando...' : 'Guardar y continuar'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
