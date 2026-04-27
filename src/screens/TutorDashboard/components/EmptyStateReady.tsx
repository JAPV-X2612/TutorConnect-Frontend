import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

/**
 * Shown when a tutor has uploaded certifications but has no sessions yet.
 * Confirms their profile is active and visible to learners.
 */
export function EmptyStateReady() {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-5">
        <Ionicons name="checkmark-circle-outline" size={36} color="#006A75" />
      </View>

      <Text className="text-xl font-bold text-text-primary text-center mb-2">
        ¡Tu perfil está activo!
      </Text>
      <Text className="text-sm text-text-muted text-center leading-5">
        Los aprendices ya pueden encontrarte. Tu primera sesión llegará pronto.
      </Text>
    </View>
  );
}
