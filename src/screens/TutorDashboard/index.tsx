import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTutorDashboard } from '@/src/hooks/useTutorDashboard';
import { EmptyStateTutor } from './components/EmptyStateTutor';
import { MetricasGrid, MetricasSkeleton } from './components/MetricasGrid';
import { ProximasSesiones } from './components/ProximasSesiones';

// ─── App header ───────────────────────────────────────────────────────────────

function DashboardHeader() {
  return (
    <View className="flex-row items-center justify-between px-5 py-3.5 bg-background">
      <View className="flex-row items-center gap-2.5">
        <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
          <Ionicons name="school" size={20} color="#FFFFFF" />
        </View>
        <Text className="text-xl font-bold text-text-primary">TutorConnect</Text>
      </View>
      <TouchableOpacity className="p-1" activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={24} color="#1A2E35" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ w, h }: { w: string; h: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={animStyle} className={`bg-gray-200 rounded-lg ${w} ${h}`} />;
}

function DashboardSkeleton() {
  return (
    <>
      <View className="px-5 pt-5 pb-3 gap-2">
        <SkeletonLine w="w-48" h="h-7" />
        <SkeletonLine w="w-64" h="h-4" />
      </View>
      <MetricasSkeleton />
      <View className="mt-7 px-5 gap-3.5">
        <SkeletonLine w="w-40" h="h-5" />
        {[0, 1, 2].map((i) => (
          <View key={i} className="flex-row items-center gap-3.5 py-3.5 border-b border-border">
            <SkeletonLine w="w-13 rounded-full" h="h-13" />
            <View className="flex-1 gap-2">
              <SkeletonLine w="w-3/4" h="h-4" />
              <SkeletonLine w="w-1/2" h="h-3" />
              <SkeletonLine w="w-2/5" h="h-3" />
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

/**
 * Tutor dashboard screen — HU-07.
 * Displays the app header, a greeting, a metrics section, and upcoming sessions.
 */
export default function TutorDashboard() {
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useTutorDashboard();

  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'Tutor';

  const isNewTutor =
    !isLoading &&
    data !== null &&
    data.metricas.total_sesiones === 0 &&
    data.metricas.ingresos_totales === 0 &&
    data.metricas.calificacion_promedio === null &&
    data.proximas_sesiones.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <DashboardHeader />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6 py-20">
            <Text className="text-red-600 text-center text-base mb-4">{error}</Text>
            <TouchableOpacity
              onPress={refetch}
              className="bg-primary rounded-full px-6 py-3"
              activeOpacity={0.85}
            >
              <Text className="text-primary-foreground font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : isNewTutor ? (
          <>
            <View className="px-5 pt-5 pb-3">
              <Text className="text-2xl font-extrabold text-text-primary">
                ¡Hola, {firstName}!
              </Text>
              <Text className="text-sm text-text-muted mt-1">
                Aquí tienes el resumen de tu actividad de hoy.
              </Text>
            </View>
            <EmptyStateTutor />
          </>
        ) : (
          <>
            <View className="px-5 pt-5 pb-3">
              <Text className="text-2xl font-extrabold text-text-primary">
                ¡Hola, {firstName}!
              </Text>
              <Text className="text-sm text-text-muted mt-1">
                Aquí tienes el resumen de tu actividad de hoy.
              </Text>
            </View>
            <MetricasGrid
              metricas={data!.metricas}
              proximasCount={data!.proximas_sesiones.length}
            />
            <ProximasSesiones
              sesiones={data!.proximas_sesiones}
              hasActivity={data!.metricas.total_sesiones > 0}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
