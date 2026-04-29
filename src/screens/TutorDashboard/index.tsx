/**
 * @file TutorDashboard/index.tsx
 * @description Tutor dashboard screen — HU-07.
 *   Displays a greeting, metric cards, and upcoming sessions.
 * @author TutorConnect Team
 */

import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AppHeader } from '@/src/components/ui/AppHeader';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import { useTutorDashboard } from '@/src/hooks/useTutorDashboard';
import { EmptyStateTutor } from './components/EmptyStateTutor';
import { MetricasGrid, MetricasSkeleton } from './components/MetricasGrid';
import { ProximasSesiones } from './components/ProximasSesiones';

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG = '#FFFFFF';
const DARK = '#0D2B22';
const MUTED = '#6B8C82';
const PRIMARY = '#006A75';

// ─── Bell button for the dashboard header ────────────────────────────────────

function BellButton() {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: 'rgba(107,140,130,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="notifications-outline" size={18} color={DARK} />
    </TouchableOpacity>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ w, h }: { w: number; h: number }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[anim, { width: w, height: h, backgroundColor: '#C2D9D3', borderRadius: 6 }]}
    />
  );
}

function DashboardSkeleton() {
  return (
    <>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 8, marginBottom: 4 }}>
        <SkeletonLine w={180} h={26} />
        <SkeletonLine w={240} h={16} />
      </View>
      <MetricasSkeleton />
    </>
  );
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function Greeting({ firstName }: { firstName: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: DARK, marginBottom: 4 }}>
        ¡Hola, {firstName}!
      </Text>
      <Text style={{ fontSize: 14, color: MUTED }}>
        Aquí tienes el resumen de tu actividad de hoy.
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TutorDashboard() {
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useTutorDashboard();
  const { get } = useApiRequest();
  const [hasCertificaciones, setHasCertificaciones] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const check = async () => {
        const result = await get<{ exists: boolean; hasCertificaciones?: boolean }>(
          API_ENDPOINTS.tutorMe,
        );
        if (cancelled) return;
        setHasCertificaciones(result.data?.hasCertificaciones ?? false);
      };
      check();
      return () => {
        cancelled = true;
      };
    // `get` recreates each render but its internal `getToken` is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'Tutor';
  const showSkeleton = isLoading || hasCertificaciones === null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <AppHeader right={<BellButton />} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {showSkeleton ? (
          <DashboardSkeleton />
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ color: '#DC2626', textAlign: 'center', fontSize: 15, marginBottom: 16 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={refetch}
              activeOpacity={0.85}
              style={{
                backgroundColor: PRIMARY,
                borderRadius: 999,
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : !hasCertificaciones ? (
          <>
            <Greeting firstName={firstName} />
            <EmptyStateTutor />
          </>
        ) : (
          <>
            <Greeting firstName={firstName} />
            <MetricasGrid metricas={data!.metricas} />
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
