import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Tutor sessions placeholder.
 *
 * Full implementation pending (separate user story). Will eventually show
 * the tutor's upcoming agenda, pending confirmations, and session history.
 *
 * @author TutorConnect Team
 */
export default function TutorSessionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-text-primary">Mis sesiones</Text>
      </View>

      <View className="flex-1 items-center justify-center px-10">
        <Ionicons name="calendar-outline" size={56} color="#94A3B8" />
        <Text className="text-text-primary text-lg font-bold mt-4 mb-2 text-center">
          Aún no hay sesiones
        </Text>
        <Text className="text-text-muted text-sm text-center">
          Cuando un aprendiz reserve una clase contigo, la verás aquí con su
          estado y la hora acordada.
        </Text>
      </View>
    </SafeAreaView>
  );
}
