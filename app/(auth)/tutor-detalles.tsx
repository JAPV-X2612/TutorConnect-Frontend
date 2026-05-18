import { Ionicons } from '@expo/vector-icons';
import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectInput } from '@/components/ui/select-input';
import { CITIES } from '@/constants/registration-options';
import { API_ENDPOINTS } from '@/constants/api';
import { useApiRequest } from '@/services/api';
import { setTutorOnboarding } from '@/hooks/use-tutor-onboarding';

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_BIO = 80;
type Step = 'identity' | 'story';

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ text, optional, error }: { text: string; optional?: boolean; error?: boolean }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: error ? '#F87171' : '#64748B',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
    }}>
      {text}
      {optional && (
        <Text style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>
          {' '}(opcional)
        </Text>
      )}
    </Text>
  );
}

const inputStyle = {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 14,
  color: '#0F172A',
} as const;

const inputErrorStyle = { ...inputStyle, borderColor: '#F87171' } as const;

// ── TutorDetallesScreen ───────────────────────────────────────────────────────

/**
 * Two-step tutor onboarding screen.
 *
 * Step 1 — Identity: name, ID, city.
 * Step 2 — Story: bio and teaching approach (min 80 chars).
 *
 * Subjects, pricing and experience are collected per-course, not at profile level.
 *
 * @author TutorConnect Team
 */
export default function TutorDetallesScreen() {
  const router = useRouter();
  const clerk = useClerk();
  const { post } = useApiRequest();

  const [step, setStep] = useState<Step>('identity');

  // Step 1 — Identity
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [ciudad, setCiudad] = useState('');

  // Step 2 — Story
  const [bio, setBio] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Validation ───────────────────────────────────────────────────────────────

  const identityValid = nombre.trim().length >= 2 && apellido.trim().length >= 2;
  const storyValid = bio.trim().length >= MIN_BIO;

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!storyValid) return;
    setLoading(true);
    setError(null);

    try {
      const email = clerk.user?.primaryEmailAddress?.emailAddress ?? '';
      const payload = {
        email,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        cedula: cedula.trim() || undefined,
        ciudad: ciudad || undefined,
        descripcion: bio.trim(),
      };

      const response = await post(API_ENDPOINTS.tutorRegister, payload);

      if (response.status === 201 || response.status === 200 || response.status === 409) {
        const onboardingData = {
          tutorId: response.data?.id ?? '',
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          bio: bio.trim(),
        };
        setTutorOnboarding(onboardingData);
        try {
          await clerk.user?.reload();
          await clerk.session?.reload();
        } catch {}
        router.push('/(auth)/tutor-primer-curso' as any);
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

  // ── Progress bar ─────────────────────────────────────────────────────────────

  const stepIndex = step === 'identity' ? 0 : 1;

  const ProgressBar = () => (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: 12 }}>
      {[0, 1].map((i) => (
        <View key={i} style={{
          height: 4, borderRadius: 2,
          width: i === stepIndex ? 32 : 20,
          backgroundColor: i <= stepIndex ? '#006A75' : '#CBD5E1',
        }} />
      ))}
    </View>
  );

  // ── Step 1 — Identity ─────────────────────────────────────────────────────────

  if (step === 'identity') {
    const canContinue = identityValid;
    const showErrors = submitted && !canContinue;

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }} accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}><ProgressBar /></View>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ paddingTop: 8, paddingBottom: 24 }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
                Cuéntanos quién eres
              </Text>
              <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 21 }}>
                Esta información verifica tu identidad en la plataforma.
              </Text>
            </View>

            {/* Nombre + Apellido */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Label text="Nombre" error={showErrors && nombre.trim().length < 2} />
                <TextInput
                  style={showErrors && nombre.trim().length < 2 ? inputErrorStyle : inputStyle}
                  placeholder="Juan"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Label text="Apellido" error={showErrors && apellido.trim().length < 2} />
                <TextInput
                  style={showErrors && apellido.trim().length < 2 ? inputErrorStyle : inputStyle}
                  placeholder="Pérez"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  value={apellido}
                  onChangeText={setApellido}
                />
              </View>
            </View>

            {/* Cédula */}
            <Label text="Cédula" optional />
            <TextInput
              style={[inputStyle, { marginBottom: 16 }]}
              placeholder="1234567890"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={cedula}
              onChangeText={setCedula}
            />

            {/* Ciudad */}
            <Label text="Ciudad" optional />
            <View style={{ marginBottom: 32 }}>
              <SelectInput
                options={CITIES}
                value={ciudad}
                onChange={setCiudad}
                placeholder="¿Dónde das clases?"
              />
            </View>

            <TouchableOpacity
              onPress={() => { setSubmitted(true); if (canContinue) setStep('story'); }}
              activeOpacity={0.85}
              style={{
                backgroundColor: canContinue ? '#006A75' : '#E2E8F0',
                borderRadius: 99, paddingVertical: 16, alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: canContinue ? '#fff' : '#94A3B8' }}>
                Continuar
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2 — Story ────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => setStep('identity')} style={{ padding: 8 }} accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}><ProgressBar /></View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingTop: 8, paddingBottom: 24 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
              Tu historia como tutor
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 21 }}>
              Cuéntales a los estudiantes quién eres, qué te hace especial y cómo enseñas.
              Esto también mejora cómo te encuentran en la búsqueda.
            </Text>
          </View>

          {error && (
            <View style={{
              backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
            </View>
          )}

          <Label
            text="Sobre ti"
            error={submitted && bio.trim().length < MIN_BIO}
          />
          <TextInput
            style={{
              ...inputStyle,
              minHeight: 140, textAlignVertical: 'top', marginBottom: 4,
              borderColor: submitted && bio.trim().length < MIN_BIO ? '#F87171' : '#E2E8F0',
            }}
            placeholder={
              'Ej: Soy ingeniero de sistemas con 4 años enseñando programación. ' +
              'Me especializo en hacer temas complejos simples mediante ejemplos ' +
              'prácticos del mundo real. Mis estudiantes suelen ver resultados desde la primera sesión...'
            }
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={800}
            value={bio}
            onChangeText={setBio}
          />
          <Text style={{
            fontSize: 11, textAlign: 'right', marginBottom: 28,
            color: bio.trim().length >= MIN_BIO ? '#94A3B8' : '#F87171',
          }}>
            {bio.trim().length}/{MIN_BIO} mín.
          </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              backgroundColor: storyValid ? '#006A75' : '#E2E8F0',
              borderRadius: 99, paddingVertical: 16, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 8,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize: 16, fontWeight: '600', color: storyValid ? '#fff' : '#94A3B8' }}>
                  Crear mi perfil de tutor
                </Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
