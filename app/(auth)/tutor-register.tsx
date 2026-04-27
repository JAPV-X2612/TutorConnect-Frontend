import { API_ENDPOINTS } from '@/constants/api';
import { useApiRequest } from '@/services/api';
import { useOAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BannerError = 'network' | 'generic' | 'unauthorized' | 'no_email';

const BANNER_MESSAGES: Record<BannerError, string> = {
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo.',
  generic: 'Completa todos los campos requeridos.',
  unauthorized: 'Debes iniciar sesión para registrar tu perfil de tutor.',
  no_email: 'No se encontró un email en tu cuenta. Intenta iniciar sesión de nuevo.',
};

interface TutorMeResponse {
  exists: boolean;
  id?: string;
  hasCertificaciones?: boolean;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function ScreenHeader({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center justify-between px-5 py-3.5">
      <TouchableOpacity
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={22} color="#1A2E35" />
      </TouchableOpacity>
      <Text className="text-base font-bold text-text-primary">Registro de Tutor</Text>
      <View style={{ width: 32 }} />
    </View>
  );
}

function ProgressBar({
  label,
  step,
  total,
  fill,
}: {
  label: string;
  step: number;
  total: number;
  fill: string;
}) {
  return (
    <View className="px-5 mt-3">
      <View className="flex-row justify-between mb-2">
        <Text className="text-sm font-bold text-text-primary">{label}</Text>
        <Text className="text-xs text-text-muted">
          Paso {step} de {total}
        </Text>
      </View>
      <View className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
        <View className="h-full rounded-full bg-primary" style={{ width: fill }} />
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TutorRegisterScreen() {
  const router = useRouter();
  const { post, get } = useApiRequest();
  const { user, isLoaded } = useUser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // True while checking GET /tutors/me after authentication.
  // Starts as true so there is no form flash when the user is already signed in.
  const [profileChecking, setProfileChecking] = useState(true);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<BannerError | null>(null);

  const nombreError =
    submitted && nombre.trim().length < 2 ? 'Requerido, mín 2 caracteres' : null;
  const apellidoError =
    submitted && apellido.trim().length < 2 ? 'Requerido, mín 2 caracteres' : null;
  const isValid = nombre.trim().length >= 2 && apellido.trim().length >= 2;

  // On authentication: check whether the tutor profile already exists (re-entry guard).
  // If it does, skip the form and go straight to certifications with the existing id.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const checkExisting = async () => {
      const result = await get<TutorMeResponse>(API_ENDPOINTS.tutorMe);
      if (cancelled) return;

      if (result.data?.exists && result.data?.id) {
        router.replace({
          pathname: '/(auth)/tutor-certifications' as any,
          params: { tutorId: result.data.id },
        });
      } else {
        setProfileChecking(false);
      }
    };

    checkExisting();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/onboarding');
  };

  const handleGoogleAuth = async () => {
    setOauthError(null);
    setOauthLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        // useEffect will fire once user updates — profile check handles navigation
      }
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED' || err?.message?.includes('cancel')) return;
      setOauthError('No pudimos conectar con Google. Intenta de nuevo.');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleContinue = async () => {
    setSubmitted(true);
    setBannerError(null);
    if (!isValid) return;

    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      setBannerError('no_email');
      return;
    }

    const payload = {
      email,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      descripcion: descripcion.trim() || undefined,
    };

    setLoading(true);
    try {
      const response = await post(API_ENDPOINTS.tutorRegister, payload);

      if (response.status === 201 || response.status === 200) {
        const tutorId = (response.data as { id?: string })?.id;
        router.push({
          pathname: '/(auth)/tutor-certifications' as any,
          params: { tutorId },
        });
      } else if (response.status === 409) {
        // Profile already exists — fetch its id and continue to certifications.
        const me = await get<TutorMeResponse>(API_ENDPOINTS.tutorMe);
        if (me.data?.id) {
          router.push({
            pathname: '/(auth)/tutor-certifications' as any,
            params: { tutorId: me.data.id },
          });
        } else {
          setBannerError('generic');
        }
      } else if (response.status === 401) {
        setBannerError('unauthorized');
      } else if (response.status === 0) {
        setBannerError('network');
      } else {
        setBannerError('generic');
      }
    } catch {
      setBannerError('network');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading states ─────────────────────────────────────────────────────────

  if (!isLoaded) return null;

  // Checking whether a tutor profile already exists after authentication.
  if (user && profileChecking) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#006A75" />
      </SafeAreaView>
    );
  }

  // ── Step 1: unauthenticated → Google OAuth gate ───────────────────────────
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenHeader onBack={handleBack} />
        <ProgressBar label="Verificación de identidad" step={1} total={3} fill="33%" />

        <View className="flex-1 px-5 justify-center">
          <Text className="text-3xl font-extrabold text-text-primary mb-2 mt-8">
            Crear cuenta
          </Text>
          <Text className="text-sm text-text-muted leading-5 mb-10">
            Únete a TutorConnect y comienza a compartir tus conocimientos hoy mismo.
          </Text>

          {oauthError && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              <Text className="text-red-700 text-sm">{oauthError}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleGoogleAuth}
            disabled={oauthLoading}
            activeOpacity={0.85}
            className="flex-row items-center justify-center gap-3 bg-white border border-border rounded-2xl py-4 shadow-sm"
          >
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text className="text-base font-semibold text-text-primary">
              {oauthLoading ? 'Conectando...' : 'Continuar con Google'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-5 pb-10 flex-row justify-center">
          <Text className="text-sm text-text-muted">¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
            <Text className="text-sm text-text-link font-semibold">Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 2: authenticated → profile form ──────────────────────────────────
  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView className="flex-1 bg-background">
        <ScreenHeader onBack={handleBack} />
        <ProgressBar label="Información Personal" step={2} total={3} fill="66%" />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          <View className="px-5 mt-7 mb-6">
            <Text className="text-3xl font-extrabold text-text-primary mb-2">Tu perfil</Text>
            <Text className="text-sm text-text-muted leading-5">
              Cuéntanos sobre ti para conectar con aprendices.
            </Text>
          </View>

          {bannerError && (
            <View className="mx-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <Text className="text-red-700 text-sm">{BANNER_MESSAGES[bannerError]}</Text>
            </View>
          )}

          {/* Email — read-only, verified via Google */}
          <View className="px-5 mb-5">
            <Text className="text-sm font-bold text-text-primary mb-1.5">
              Correo electrónico
            </Text>
            <View className="bg-white border border-border rounded-xl px-4 py-3.5 flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={16} color="#006A75" />
              <Text className="text-sm text-text-muted flex-1" numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>

          {/* Nombre */}
          <View className="px-5 mb-5">
            <Text className="text-sm font-bold text-text-primary mb-1.5">Nombre</Text>
            <TextInput
              className={`bg-white border rounded-xl px-4 py-3.5 text-base text-text-primary ${
                nombreError ? 'border-red-400' : 'border-border'
              }`}
              placeholder="Ej. Juan"
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
          <View className="px-5 mb-5">
            <Text className="text-sm font-bold text-text-primary mb-1.5">Apellido</Text>
            <TextInput
              className={`bg-white border rounded-xl px-4 py-3.5 text-base text-text-primary ${
                apellidoError ? 'border-red-400' : 'border-border'
              }`}
              placeholder="Ej. Pérez"
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
          <View className="px-5 mb-8">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-sm font-bold text-text-primary">
                Descripción{' '}
                <Text className="font-normal text-text-muted">(Opcional)</Text>
              </Text>
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

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isValid || loading}
            activeOpacity={0.85}
            className={`mx-5 rounded-2xl py-4 items-center ${
              isValid ? 'bg-primary' : 'bg-secondary opacity-50'
            }`}
          >
            <Text
              className={`text-base font-bold ${
                isValid ? 'text-primary-foreground' : 'text-text-muted'
              }`}
            >
              {loading ? 'Enviando...' : 'Continuar →'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-sm text-text-muted">¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
              <Text className="text-sm text-text-link font-semibold">Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
