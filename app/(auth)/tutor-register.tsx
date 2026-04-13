import { API_ENDPOINTS } from '@/constants/api';
import { useApiRequest } from '@/services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BannerError = 'conflict' | 'network' | 'generic' | 'unauthorized';

const BANNER_MESSAGES: Record<BannerError, string> = {
  conflict: 'Ya tienes un perfil de tutor registrado.',
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo.',
  generic: 'Completa todos los campos requeridos.',
  unauthorized: 'Debes iniciar sesión para registrar tu perfil de tutor.',
};

export default function TutorRegisterScreen() {
  const router = useRouter();
  const { post } = useApiRequest();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<BannerError | null>(null);

  // Validation
  const nombreError =
    submitted && nombre.trim().length < 2 ? 'Requerido, mín 2 caracteres' : null;
  const apellidoError =
    submitted && apellido.trim().length < 2 ? 'Requerido, mín 2 caracteres' : null;

  const isValid = nombre.trim().length >= 2 && apellido.trim().length >= 2;

  const handleContinue = async () => {
    setSubmitted(true);
    setBannerError(null);

    if (!isValid) return;

    setLoading(true);
    try {
      const response = await post(API_ENDPOINTS.tutorRegister, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        descripcion: descripcion.trim() || null,
      });

      if (response.status === 201 || response.status === 200) {
        // Navigate to certification upload screen
        router.push('/(auth)/tutor-certificaciones' as any);
      } else if (response.status === 409) {
        setBannerError('conflict');
      } else if (response.status === 401) {
        setBannerError('unauthorized');
      } else if (response.status === 0) {
        setBannerError('network');
      } else {
        setBannerError('generic');
      }
    } catch (err) {
      setBannerError('network');
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          scrollEnabled={true}
          className="flex-1 px-6"
        >
          <View className="pt-8 pb-4">
            <Text className="text-3xl font-bold text-text-primary mb-2">
              Registro de Tutor
            </Text>
            <Text className="text-base text-text-muted">
              Cuéntanos sobre ti y tus certificaciones.
            </Text>
          </View>

          {bannerError && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              <Text className="text-red-700 text-sm">{BANNER_MESSAGES[bannerError]}</Text>
            </View>
          )}

          {/* Nombre */}
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

          {/* Apellido */}
          <View className="mb-5">
            <TextInput
              className={`bg-white border rounded-xl px-4 py-3.5 text-base text-text-primary ${
                apellidoError ? 'border-red-400' : 'border-border'
              }`}
              placeholder="Tu apellido"
              autoCapitalize="words"
              autoCorrect={false}
              value={apellido}
              onChangeText={setApellido}
            />
            {apellidoError && (
              <Text className="text-red-500 text-xs mt-1 ml-1">{apellidoError}</Text>
            )}
          </View>

          {/* Descripción */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-text-muted">Descripción (Opcional)</Text>
              <Text className="text-xs text-text-muted">{descripcion.length}/500</Text>
            </View>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3.5 text-base text-text-primary"
              placeholder="Cuéntanos sobre tu experiencia..."
              multiline
              numberOfLines={4}
              maxLength={500}
              value={descripcion}
              onChangeText={setDescripcion}
              textAlignVertical="top"
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isValid || loading}
            activeOpacity={0.85}
            className={`rounded-full py-4 items-center ${
              isValid ? 'bg-primary' : 'bg-secondary opacity-40'
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                isValid ? 'text-primary-foreground' : 'text-text-muted'
              }`}
            >
              {loading ? 'Enviando...' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
