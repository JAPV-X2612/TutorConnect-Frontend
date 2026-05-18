import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTutorRegistration } from '@/hooks/use-tutor-registration';

const BENEFITS = [
  { icon: 'people-outline', text: 'Llega a estudiantes que buscan tu conocimiento' },
  { icon: 'calendar-outline', text: 'Gestiona tu disponibilidad libremente' },
  { icon: 'wallet-outline', text: 'Define el precio de cada curso que ofrezcas' },
  { icon: 'shield-checkmark-outline', text: 'Perfil verificado con certificaciones' },
];

export default function TutorRegisterScreen() {
  const router = useRouter();
  const { loading, errorMessage, handleRegister } = useTutorRegistration();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-border gap-2">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-text-primary flex-1">Registro de tutor</Text>
      </View>

      <View className="flex-1 px-6 justify-between pb-8">
        <View>
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mt-4 mb-5">
            <Ionicons name="school-outline" size={32} color="#006A75" />
          </View>

          <Text className="text-3xl font-bold text-text-primary mb-2">
            Conviértete en tutor
          </Text>
          <Text className="text-base text-text-muted leading-6 mb-8">
            Registra tu perfil, crea tus cursos con su propio precio y empieza a conectar con estudiantes.
          </Text>

          <View className="gap-4 mb-8">
            {BENEFITS.map((b) => (
              <View key={b.icon} className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
                  <Ionicons name={b.icon as any} size={18} color="#006A75" />
                </View>
                <Text className="text-sm text-text-primary flex-1">{b.text}</Text>
              </View>
            ))}
          </View>

          {errorMessage ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <Text className="text-red-700 text-sm">{errorMessage}</Text>
            </View>
          ) : null}
        </View>

        <View className="gap-3">
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            className="flex-row items-center justify-center gap-3 bg-white border border-border rounded-full py-4 shadow-sm"
          >
            {loading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text className="text-base font-semibold text-text-primary">
                  Continuar con Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)} disabled={loading} className="items-center py-3">
            <Text className="text-sm text-text-muted">
              ¿Ya tienes cuenta?{' '}
              <Text className="text-primary font-semibold">Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
