import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Tutor dashboard placeholder.
 *
 * Full implementation pending (separate user story). Current content shows a
 * greeting and an empty state informing the tutor that their panel is coming
 * soon. Keep this file focused on placeholder UI only — when the real
 * dashboard lands, extract logic into hooks per the project conventions.
 *
 * @author TutorConnect Team
 */
export default function TutorDashboardScreen() {
  const { user } = useUser();
  const displayName = user?.firstName ?? 'Tutor';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 32, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-text-primary mb-1">Hola, {displayName}</Text>
        <Text className="text-base text-text-muted mb-8">Bienvenido a tu panel de tutor</Text>

        <View className="bg-white rounded-2xl border border-border px-5 py-8 items-center">
          <Ionicons name="construct-outline" size={48} color="#006A75" />
          <Text className="text-text-primary text-lg font-bold mt-4 mb-2 text-center">
            Panel en construcción
          </Text>
          <Text className="text-text-muted text-sm text-center">
            Pronto podrás gestionar tus sesiones, ver tus estadísticas y
            responder solicitudes desde aquí.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
