import { useUser } from '@clerk/clerk-expo';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLearnerDashboard } from '@/hooks/use-learner-dashboard';
import type { SuggestedTutor, UpcomingSession } from '@/hooks/use-learner-dashboard';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (isoString: string) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonBlock({ h, w }: Readonly<{ h: number; w?: string }>) {
  return (
    <View
      className="bg-gray-200 rounded-xl"
      style={{ height: h, width: w ?? '100%', marginBottom: 8 }}
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
      <View className="flex-row gap-3">
        <SkeletonBlock h={144} w="45%" />
        <SkeletonBlock h={144} w="45%" />
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
        <View
          className="h-full bg-white rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}

function TutorCard({ tutor }: Readonly<{ tutor: SuggestedTutor }>) {
  return (
    <View
      className="bg-white border border-border rounded-2xl p-4 mr-3 w-44"
      accessibilityLabel={`Tutor ${tutor.nombre} ${tutor.apellido}`}
    >
      <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mb-2">
        <Text className="text-white font-bold text-base">
          {tutor.nombre.charAt(0)}
          {tutor.apellido.charAt(0)}
        </Text>
      </View>
      <Text className="text-text-primary font-semibold text-sm" numberOfLines={1}>
        {tutor.nombre} {tutor.apellido}
      </Text>
      {tutor.subjects.length > 0 && (
        <Text className="text-text-muted text-xs mt-1" numberOfLines={1}>
          {tutor.subjects.slice(0, 2).join(' · ')}
        </Text>
      )}
      {tutor.rating != null && (
        <Text className="text-yellow-500 text-xs mt-1">★ {tutor.rating.toFixed(1)}</Text>
      )}
      {tutor.precioHora != null && (
        <Text className="text-text-muted text-xs mt-1">{formatCOP(tutor.precioHora)}/h</Text>
      )}
    </View>
  );
}

function SessionItem({ session }: Readonly<{ session: UpcomingSession }>) {
  const statusLabel: Record<string, string> = {
    confirmed: 'Confirmada',
    pending: 'Pendiente',
  };
  const isConfirmed = session.status === 'confirmed';
  return (
    <View
      className="bg-white border border-border rounded-2xl px-4 py-3 mb-3"
      accessibilityLabel={`Sesión con ${session.tutorName} el ${formatDate(session.scheduledAt)}`}
    >
      <View className="flex-row justify-between items-center">
        <Text className="text-text-primary font-semibold text-sm flex-1 mr-2" numberOfLines={1}>
          {session.tutorName}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${isConfirmed ? 'bg-teal-100' : 'bg-amber-100'}`}>
          <Text className={`text-xs font-medium ${isConfirmed ? 'text-teal-700' : 'text-amber-700'}`}>
            {statusLabel[session.status] ?? session.status}
          </Text>
        </View>
      </View>
      <Text className="text-text-muted text-xs mt-1">{formatDate(session.scheduledAt)}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

/**
 * Learner dashboard screen (HU-06).
 *
 * Displays weekly session progress, upcoming scheduled sessions, and
 * personalised tutor suggestions based on the learner's registered interests.
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

        {/* Suggested Tutors */}
        <Text className="text-lg font-bold text-text-primary mb-3">Tutores sugeridos</Text>
        {data!.suggestedTutors.length === 0 ? (
          <View className="bg-white border border-border rounded-2xl px-4 py-6 mb-6 items-center">
            <Text className="text-text-muted text-sm text-center">
              Aún no hay tutores disponibles. Vuelve pronto.
            </Text>
          </View>
        ) : (
          <FlatList
            data={data!.suggestedTutors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TutorCard tutor={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          />
        )}

        {/* Upcoming Sessions */}
        <Text className="text-lg font-bold text-text-primary mb-3">Próximas sesiones</Text>
        {data!.upcomingSessions.length === 0 ? (
          <View className="bg-white border border-border rounded-2xl px-4 py-6 items-center">
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
