import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLearnerRegistration } from '../../hooks/use-learner-registration';
import { SelectInput } from '../../components/ui/select-input';
import { InterestPicker } from '../../components/ui/interest-picker';
import { CITIES, ORGANIZATIONS, PROGRAMS, INTERESTS } from '../../constants/registration-options';

type BannerError = 'network' | 'generic';

const BANNER_MESSAGES: Record<BannerError, string> = {
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo.',
  generic: 'No pudimos conectar con Google. Intenta de nuevo.',
};

export default function RegisterScreen() {
  const router = useRouter();
  const {
    form,
    setForm,
    loading,
    bannerError,
    errors,
    addInterest,
    removeInterest,
    handleRegister,
  } = useLearnerRegistration();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-text-primary mb-1">Crear cuenta</Text>
        <Text className="text-base text-text-muted mb-8">
          Cuéntanos sobre ti para conectarte con los mejores tutores.
        </Text>

        {bannerError && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
            <Text className="text-red-700 text-sm">{BANNER_MESSAGES[bannerError]}</Text>
          </View>
        )}

        {/* Organization */}
        <View className="mb-5">
          <Text className="text-sm font-semibold text-text-primary mb-1.5">
            Universidad, empresa u organización{' '}
            <Text className="text-red-500">*</Text>
          </Text>
          <SelectInput
            options={ORGANIZATIONS}
            value={form.organizationName}
            onChange={(v) => setForm((prev) => ({ ...prev, organizationName: v }))}
            placeholder="Selecciona tu organización"
            otherLabel="Otra"
            hasError={!!errors.organizationName}
          />
          {errors.organizationName && (
            <Text className="text-red-500 text-xs mt-1 ml-1">{errors.organizationName}</Text>
          )}
        </View>

        {/* Academic program */}
        <View className="mb-5">
          <Text className="text-sm font-semibold text-text-primary mb-1.5">
            Programa académico
          </Text>
          <SelectInput
            options={PROGRAMS}
            value={form.program}
            onChange={(v) => setForm((prev) => ({ ...prev, program: v }))}
            placeholder="Selecciona tu programa"
            otherLabel="Otro"
          />
        </View>

        {/* City */}
        <View className="mb-5">
          <Text className="text-sm font-semibold text-text-primary mb-1.5">Ciudad</Text>
          <SelectInput
            options={CITIES}
            value={form.city}
            onChange={(v) => setForm((prev) => ({ ...prev, city: v }))}
            placeholder="Selecciona tu ciudad"
            otherLabel="Otra"
          />
        </View>

        {/* Current semester */}
        <View className="mb-5">
          <Text className="text-sm font-semibold text-text-primary mb-1.5">
            Semestre actual
          </Text>
          <TextInput
            className="bg-white border border-border rounded-xl px-4 py-3.5 text-base text-text-primary"
            placeholder="Ej: 5"
            keyboardType="numeric"
            value={form.currentSemester}
            onChangeText={(v) =>
              setForm((prev) => ({ ...prev, currentSemester: v.replace(/[^0-9]/g, '') }))
            }
          />
        </View>

        {/* Interests */}
        <View className="mb-8">
          <Text className="text-sm font-semibold text-text-primary mb-1.5">
            Intereses <Text className="text-red-500">*</Text>
          </Text>
          <InterestPicker
            predefinedOptions={INTERESTS}
            selected={form.interests}
            onAdd={addInterest}
            onRemove={removeInterest}
            hasError={!!errors.interests}
          />
          {errors.interests && (
            <Text className="text-red-500 text-xs mt-1 ml-1">{errors.interests}</Text>
          )}
        </View>

        {/* Google OAuth button */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
          className="flex-row items-center justify-center gap-3 bg-white border border-border rounded-full py-4 shadow-sm"
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text className="text-base font-semibold text-text-primary">
            {loading ? 'Conectando...' : 'Continuar con Google'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View className="px-6 pb-6 flex-row justify-center">
        <Text className="text-sm text-text-muted">¿Ya tienes cuenta? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
          <Text className="text-sm text-text-link font-semibold">Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
