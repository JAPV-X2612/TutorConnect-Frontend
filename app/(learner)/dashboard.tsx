import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLearnerDashboard } from '@/hooks/use-learner-dashboard';
import type { UpcomingSession } from '@/hooks/use-learner-dashboard';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatMonthAbbrev = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', { month: 'short' })
    .format(date)
    .replaceAll('.', '')
    .toUpperCase()
    .slice(0, 3);

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonBlock({ h, w }: Readonly<{ h: number; w?: string | number }>) {
  return (
    <View
      className="bg-gray-200 rounded-xl"
      style={{ height: h, width: (w ?? '100%') as any, marginBottom: 8 }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background px-6 pt-8">
      <SkeletonBlock h={32} w="60%" />
      <SkeletonBlock h={16} w="40%" />
      <View style={{ marginTop: 16 }}>
        <SkeletonBlock h={112} />
      </View>
      <SkeletonBlock h={16} w="50%" />
      <SkeletonBlock h={72} />
      <SkeletonBlock h={72} />
    </SafeAreaView>
  );
}

function ErrorView({ message, onRetry }: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-text-primary text-center mb-4">{message}</Text>
      <TouchableOpacity
        onPress={onRetry}
        accessibilityLabel="Reintentar carga del panel"
        className="bg-primary rounded-full px-6 py-3"
      >
        <Text className="text-primary-foreground font-semibold">Reintentar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function WeeklyProgressCard({ completed, total }: Readonly<{ completed: number; total: number }>) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <View
      className="bg-teal-600 rounded-2xl px-5 py-4 mb-6"
      accessibilityLabel={`Progreso semanal: ${completed} de ${total} sesiones`}
    >
      <Text className="text-white text-sm font-medium mb-1">Progreso semanal</Text>
      <Text className="text-white text-3xl font-bold mb-1">
        {completed}/{total}
      </Text>
      <Text className="text-teal-100 text-xs">sesiones esta semana · {percentage}% completado</Text>
      <View className="mt-3 h-2 bg-teal-800 rounded-full overflow-hidden">
        <View className="h-full bg-white rounded-full" style={{ width: `${percentage}%` }} />
      </View>
    </View>
  );
}

function SessionItem({ session }: Readonly<{ session: UpcomingSession }>) {
  const date = new Date(session.scheduledAt);
  const month = formatMonthAbbrev(date);
  const day = date.getDate();
  const time = formatTime(date);

  return (
    <View
      className="bg-white rounded-2xl px-3 py-3 mb-3 flex-row items-center"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}
      accessibilityLabel={`${session.subject} con ${session.tutorName} el ${month} ${day} a las ${time}`}
    >
      <View className="bg-teal-50 rounded-2xl w-16 h-16 items-center justify-center mr-3">
        <Text className="text-teal-700 text-xs font-bold tracking-wider">{month}</Text>
        <Text className="text-teal-900 text-2xl font-bold leading-7">{day}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-text-primary text-base font-bold" numberOfLines={1}>
          {session.subject}
        </Text>
        <Text className="text-text-muted text-sm mt-0.5" numberOfLines={1}>
          Con {session.tutorName} · {time}
        </Text>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

/**
 * Learner dashboard screen (HU-06).
 *
 * Displays weekly session progress and upcoming scheduled sessions.
 *
 * @author TutorConnect Team
 */
export default function LearnerDashboardScreen() {
  const { user } = useUser();
  const { data, loading, error, refetch } = useLearnerDashboard();
  const displayName = user?.firstName ?? 'Aprendiz';

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 32, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Text className="text-3xl font-bold text-text-primary mb-1">Hola, {displayName}</Text>
        <Text className="text-base text-text-muted mb-6">¿Listo para aprender hoy?</Text>

        {/* Weekly Progress */}
        <WeeklyProgressCard
          completed={data!.weeklyProgress.completed}
          total={data!.weeklyProgress.total}
        />

        {/* Upcoming Sessions */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-text-primary">Próximas Sesiones</Text>
          <Ionicons name="calendar-outline" size={20} color="#64748B" />
        </View>

        {data!.upcomingSessions.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-6 items-center">
            <Text className="text-text-muted text-sm text-center mb-3">
              No tienes sesiones programadas.
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-full px-5 py-2"
              accessibilityLabel="Buscar un tutor"
            >
              <Text className="text-primary-foreground text-sm font-semibold">Buscar tutor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          data!.upcomingSessions.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
