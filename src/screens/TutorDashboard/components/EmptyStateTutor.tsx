import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * Shown when a tutor has not yet uploaded any certifications.
 * Directs them to the certification upload flow to complete registration.
 */
export function EmptyStateTutor() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-5">
        <Ionicons name="document-attach-outline" size={36} color="#006A75" />
      </View>

      <Text className="text-xl font-bold text-text-primary text-center mb-2">
        ¡Bienvenido a TutorConnect!
      </Text>
      <Text className="text-sm text-text-muted text-center leading-5 mb-8">
        Sube tus certificaciones para que los aprendices puedan encontrarte
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/tutor-register' as any)}
        activeOpacity={0.85}
        className="bg-primary rounded-full px-8 py-3.5"
      >
        <Text className="text-primary-foreground font-semibold text-base">
          Subir certificaciones
        </Text>
      </TouchableOpacity>
    </View>
  );
}
