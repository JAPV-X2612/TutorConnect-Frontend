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
import { useTutorRegistration } from '@/hooks/use-tutor-registration';

const BANNER_MESSAGES: Record<string, string> = {
  conflict: 'Ya tienes un perfil de tutor registrado.',
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo.',
  generic: 'Ocurrió un error. Intenta de nuevo.',
  unauthorized: 'No pudimos completar la autenticación. Intenta de nuevo.',
};

/**
 * Tutor registration screen — collects name and bio, then triggers
 * Google OAuth and backend profile creation.
 *
 * @author TutorConnect Team
 */
export default function TutorRegisterScreen() {
  const { form, setForm, loading, bannerError, errors, isFormValid, handleRegister } =
    useTutorRegistration();

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
                errors.nombre ? 'border-red-400' : 'border-border'
              }`}
              placeholder="Tu nombre"
              autoCapitalize="words"
              autoCorrect={false}
              value={form.nombre}
              onChangeText={(v: string) => setForm((prev: import('@/hooks/use-tutor-registration').TutorFormState) => ({ ...prev, nombre: v }))}
            />
            {errors.nombre && (
              <Text className="text-red-500 text-xs mt-1 ml-1">{errors.nombre}</Text>
            )}
          </View>

          {/* Apellido */}
          <View className="mb-5">
            <TextInput
              className={`bg-white border rounded-xl px-4 py-3.5 text-base text-text-primary ${
                errors.apellido ? 'border-red-400' : 'border-border'
              }`}
              placeholder="Tu apellido"
              autoCapitalize="words"
              autoCorrect={false}
              value={form.apellido}
              onChangeText={(v) => setForm((prev: import('@/hooks/use-tutor-registration').TutorFormState) => ({ ...prev, apellido: v }))}
            />
            {errors.apellido && (
              <Text className="text-red-500 text-xs mt-1 ml-1">{errors.apellido}</Text>
            )}
          </View>

          {/* Descripción */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-text-muted">Descripción (Opcional)</Text>
              <Text className="text-xs text-text-muted">{form.descripcion.length}/500</Text>
            </View>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3.5 text-base text-text-primary"
              placeholder="Cuéntanos sobre tu experiencia..."
              multiline
              numberOfLines={4}
              maxLength={500}
              value={form.descripcion}
              onChangeText={(v) => setForm((prev: import('@/hooks/use-tutor-registration').TutorFormState) => ({ ...prev, descripcion: v }))}
              textAlignVertical="top"
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={!isFormValid || loading}
            activeOpacity={0.85}
            className={`rounded-full py-4 items-center ${
              isFormValid ? 'bg-primary' : 'bg-secondary opacity-40'
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                isFormValid ? 'text-primary-foreground' : 'text-text-muted'
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
