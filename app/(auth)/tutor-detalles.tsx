import { Ionicons } from '@expo/vector-icons';
import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectInput } from '@/components/ui/select-input';
import { CITIES } from '@/constants/registration-options';
import { API_ENDPOINTS } from '@/constants/api';
import { useApiRequest } from '@/services/api';
import { getTutorOnboarding, setTutorOnboarding } from '@/hooks/use-tutor-onboarding';

const MIN_BIO = 30;

export default function TutorDetallesScreen() {
  const router = useRouter();
  const clerk = useClerk();
  const { post } = useApiRequest();
  const saved = getTutorOnboarding();

  const [nombre, setNombre] = useState(saved.nombre);
  const [apellido, setApellido] = useState(saved.apellido);
  const [cedula, setCedula] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [bio, setBio] = useState(saved.bio);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    nombre: submitted && nombre.trim().length < 2,
    apellido: submitted && apellido.trim().length < 2,
    bio: submitted && bio.trim().length < MIN_BIO,
  };

  const canSubmit = nombre.trim().length >= 2 && apellido.trim().length >= 2 && bio.trim().length >= MIN_BIO;

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    try {
      const email = clerk.user?.primaryEmailAddress?.emailAddress ?? '';
      const response = await post(API_ENDPOINTS.tutorRegister, {
        email,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        cedula: cedula.trim() || undefined,
        ciudad: ciudad || undefined,
        descripcion: bio.trim(),
      });

      if (response.status === 201 || response.status === 200 || response.status === 409) {
        setTutorOnboarding({
          tutorId: response.data?.id ?? '',
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          bio: bio.trim(),
        });
        // Silently refresh Clerk metadata — errors here are non-fatal since
        // index.tsx refetches the DB profile on focus, which is the source
        // of truth for routing. The JWT will auto-refresh on its own cycle.
        try {
          await clerk.user?.reload();
          await clerk.session?.reload();
        } catch {
          // ignore Clerk "invalid state" after updateUserMetadata
        }
        router.replace('/');
      } else if (response.status === 0) {
        setError('Sin conexión. Verifica tu internet e intenta de nuevo.');
      } else {
        setError('Ocurrió un error. Intenta de nuevo.');
      }
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-text-primary ml-3">Información personal</Text>
        </View>

        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <View className="pt-5 pb-4">
            <Text className="text-2xl font-bold text-text-primary mb-1">Cuéntanos sobre ti</Text>
            <Text className="text-sm text-text-muted">
              Esta información es para verificar tu identidad. Tus cursos y tarifas los defines después.
            </Text>
          </View>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          {/* Name row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                Nombre {errors.nombre && <Text className="text-red-400 normal-case">— requerido</Text>}
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3.5 text-base text-text-primary ${errors.nombre ? 'border-red-400' : 'border-border'}`}
                placeholder="Juan"
                autoCapitalize="words"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                Apellido {errors.apellido && <Text className="text-red-400 normal-case">— requerido</Text>}
              </Text>
              <TextInput
                className={`bg-white border rounded-xl px-4 py-3.5 text-base text-text-primary ${errors.apellido ? 'border-red-400' : 'border-border'}`}
                placeholder="Pérez"
                autoCapitalize="words"
                value={apellido}
                onChangeText={setApellido}
              />
            </View>
          </View>

          {/* Cedula + Ciudad row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                Cédula <Text className="font-normal normal-case">(opcional)</Text>
              </Text>
              <TextInput
                className="bg-white border border-border rounded-xl px-4 py-3.5 text-base text-text-primary"
                placeholder="1234567890"
                keyboardType="numeric"
                value={cedula}
                onChangeText={setCedula}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Ciudad</Text>
              <SelectInput options={CITIES} value={ciudad} onChange={setCiudad} placeholder="Selecciona" />
            </View>
          </View>

          {/* Bio */}
          <Text className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
            Bibliografía {errors.bio && <Text className="text-red-400 normal-case">— mín. {MIN_BIO} caracteres</Text>}
          </Text>
          <View className={`bg-white border rounded-xl mb-1 ${errors.bio ? 'border-red-400' : 'border-border'}`}>
            <TextInput
              className="px-4 py-3 text-base text-text-primary"
              placeholder="Cuéntale a los estudiantes quién eres, tu trayectoria y experiencia..."
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
              style={{ minHeight: 120 }}
            />
          </View>
          <Text className={`text-xs mb-6 ${bio.trim().length >= MIN_BIO ? 'text-text-muted' : 'text-red-400'}`}>
            {bio.trim().length}/{MIN_BIO} mín.
          </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
            className={`rounded-full py-4 items-center flex-row justify-center gap-2 ${canSubmit ? 'bg-primary' : 'bg-gray-200'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className={`text-base font-semibold ${canSubmit ? 'text-white' : 'text-gray-400'}`}>
                Crear perfil de tutor
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
