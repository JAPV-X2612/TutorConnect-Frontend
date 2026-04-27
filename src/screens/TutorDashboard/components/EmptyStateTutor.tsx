import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * Shown when a tutor has no activity yet (all metrics are zero / null).
 * Encourages them to complete their profile so learners can discover them.
 */
export function EmptyStateTutor() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-5">
        <Ionicons name="school-outline" size={36} color="#006A75" />
      </View>

      <Text className="text-xl font-bold text-text-primary text-center mb-2">
        ¡Bienvenido a TutorConnect!
      </Text>
      <Text className="text-sm text-text-muted text-center leading-5 mb-8">
        Completa tu perfil para recibir solicitudes de aprendices
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(tutor)/profile' as any)}
        activeOpacity={0.85}
        className="bg-primary rounded-full px-8 py-3.5"
      >
        <Text className="text-primary-foreground font-semibold text-base">
          Ir a mi perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
}
