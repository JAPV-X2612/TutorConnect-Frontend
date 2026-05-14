import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useProfile } from '@/hooks/use-profile';
import { useTutorCourses } from '@/hooks/use-tutor-courses';
import { useTutorPaymentHistory } from '@/hooks/use-tutor-payment-history';
import { useTutorReviews } from '@/hooks/use-tutor-reviews';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

// ── Sub-components ────────────────────────────────────────────────────────────

interface EarningsCardProps {
  onViewHistory: () => void;
  netTotal: number;
  grossTotal: number;
  totalSessions: number;
  commissionTotal: number;
  loading: boolean;
}

function EarningsCard({ onViewHistory, netTotal, grossTotal, totalSessions, commissionTotal, loading }: EarningsCardProps) {
  return (
    <View className="mx-6 mb-5 bg-primary rounded-2xl p-5">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
          Ganancias este mes
        </Text>
        <TouchableOpacity
          onPress={onViewHistory}
          activeOpacity={0.8}
          accessibilityLabel="Ver historial de pagos"
        >
          <Text className="text-white/80 text-xs font-semibold underline">Ver historial</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="rgba(255,255,255,0.7)" style={{ marginVertical: 10 }} />
      ) : (
        <Text className="text-white text-3xl font-bold mb-4">{formatCOP(netTotal)}</Text>
      )}
      <View className="flex-row gap-4 pt-4 border-t border-white/20">
        <View className="flex-1">
          <Text className="text-white/60 text-xs mb-0.5">Bruto mes</Text>
          <Text className="text-white font-semibold text-sm">{loading ? '—' : formatCOP(grossTotal)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white/60 text-xs mb-0.5">Sesiones este mes</Text>
          <Text className="text-white font-semibold text-sm">{loading ? '—' : totalSessions}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white/60 text-xs mb-0.5">Comisión</Text>
          <Text className="text-white font-semibold text-sm">{loading ? '—' : formatCOP(commissionTotal)}</Text>
        </View>
      </View>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= rating ? 'star' : s - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={13}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

function ReviewsCard({
  averageRating,
  totalReviews,
  loading,
  onViewAll,
}: {
  averageRating: number;
  totalReviews: number;
  loading: boolean;
  onViewAll: () => void;
}) {
  if (loading) {
    return (
      <View className="mx-6 mb-5 bg-white border border-border rounded-2xl p-5 items-center justify-center h-24">
        <ActivityIndicator color="#006A75" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onViewAll}
      activeOpacity={0.8}
      accessibilityLabel="Ver todas las reseñas"
      className="mx-6 mb-5 bg-white border border-border rounded-2xl p-5 flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
          <Ionicons name="star" size={20} color="#F59E0B" />
        </View>
        <View>
          <Text className="text-text-primary font-semibold text-sm">Reseñas</Text>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <Text className="text-text-primary font-bold text-base">{averageRating.toFixed(1)}</Text>
            <StarRating rating={Math.round(averageRating)} />
            <Text className="text-text-muted text-xs">· {totalReviews} reseñas</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#006A75" />
    </TouchableOpacity>
  );
}

interface CourseCardProps {
  subject: string;
  price: number;
  duration: number;
  onEdit: () => void;
}

function CourseCard({ subject, price, duration, onEdit }: CourseCardProps) {
  return (
    <View className="bg-white border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-base">{subject}</Text>
          <View className="flex-row gap-3 mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="cash-outline" size={13} color="#64748B" />
              <Text className="text-text-muted text-xs">${price.toLocaleString('es-CO')} COP</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text className="text-text-muted text-xs">{duration} min</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={onEdit}
          activeOpacity={0.7}
          className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center"
        >
          <Ionicons name="pencil-outline" size={15} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TutorDashboardScreen() {
  const { user } = useUser();
  const { profile, loading } = useProfile();
  const { courses, loading: coursesLoading, refetch } = useTutorCourses();
  const router = useRouter();
  const api = useApiRequest();
  const isActive = profile?.status === 'ACTIVE';
  const [pendingCount, setPendingCount] = useState(0);

  const { from, to } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${lastDay}` };
  }, []);

  const { data: paymentData, loading: paymentLoading, refetch: refetchPayment } = useTutorPaymentHistory(from, to);
  const { data: reviewsData, loading: reviewsLoading, refetch: refetchReviews } = useTutorReviews();
  const [refreshing, setRefreshing] = useState(false);

  const fetchPending = useCallback(() => {
    api.get<{ id: string; status: string }[]>(API_ENDPOINTS.tutorBookings).then((res) => {
      if (Array.isArray(res.data)) {
        setPendingCount(res.data.filter((b) => b.status === 'pending').length);
      }
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refetch();
    refetchPayment();
    refetchReviews();
    fetchPending();
    setRefreshing(false);
  }, [refetch, refetchPayment, refetchReviews, fetchPending]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchPayment();
      refetchReviews();
      fetchPending();
    }, [refetch, refetchPayment, refetchReviews, fetchPending]),
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#006A75" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#006A75" colors={['#006A75']} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-text-primary">
              Hola, {user?.firstName ?? 'Tutor'}
            </Text>
            <Text className="text-text-muted text-sm mt-0.5">
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full ${isActive ? 'bg-green-100' : 'bg-amber-100'}`}>
            <Text className={`text-xs font-semibold ${isActive ? 'text-green-700' : 'text-amber-700'}`}>
              {isActive ? 'Activo' : 'En revisión'}
            </Text>
          </View>
        </View>

        <EarningsCard
          onViewHistory={() => router.push('/(tutor)/payment-history' as any)}
          netTotal={paymentData?.filterSummary?.netRevenue ?? 0}
          grossTotal={paymentData?.filterSummary?.grossRevenue ?? 0}
          totalSessions={paymentData?.filterSummary?.totalSessions ?? 0}
          commissionTotal={paymentData?.filterSummary?.totalCommission ?? 0}
          loading={paymentLoading}
        />

        {/* Reviews summary */}
        {(reviewsLoading || (reviewsData && reviewsData.totalReviews > 0)) && (
          <ReviewsCard
            averageRating={reviewsData?.averageRating ?? 0}
            totalReviews={reviewsData?.totalReviews ?? 0}
            loading={reviewsLoading}
            onViewAll={() => router.push('/(tutor)/reviews' as any)}
          />
        )}

        {/* Pending sessions shortcut */}
        <View className="mx-6 mb-5 bg-white border border-border rounded-2xl p-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
              <Ionicons name="notifications-outline" size={20} color="#d97706" />
            </View>
            <View>
              <Text className="text-text-primary font-semibold text-sm">Solicitudes pendientes</Text>
              <Text className="text-text-muted text-xs mt-0.5">
                {pendingCount === 0
                  ? 'Sin solicitudes nuevas'
                  : `${pendingCount} esperando respuesta`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tutor)/sessions' as any)}
            activeOpacity={0.8}
            className="flex-row items-center gap-1"
          >
            <Text className="text-primary text-sm font-semibold">Ver</Text>
            <Ionicons name="chevron-forward" size={16} color="#006A75" />
          </TouchableOpacity>
        </View>

        {/* Courses section */}
        <View className="px-6 mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text-primary font-semibold text-base">Mis cursos</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tutor)/crear-curso' as any)}
              activeOpacity={0.8}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="add-circle-outline" size={18} color="#006A75" />
              <Text className="text-primary text-sm font-semibold">Agregar</Text>
            </TouchableOpacity>
          </View>

          {coursesLoading ? (
            <ActivityIndicator color="#006A75" style={{ marginVertical: 16 }} />
          ) : courses.filter((c) => c.isActive).length > 0 ? (
            courses
              .filter((c) => c.isActive)
              .map((c) => (
                <CourseCard
                  key={c.id}
                  subject={c.subject}
                  price={c.price}
                  duration={c.duration}
                  onEdit={() =>
                    router.push({
                      pathname: '/(tutor)/crear-curso',
                      params: {
                        courseId: c.id,
                        subject: c.subject,
                        price: String(c.price),
                        duration: String(c.duration),
                        modalidad: c.modalidad,
                        level: c.academicLevel ?? '',
                        description: c.description ?? '',
                        schedule: JSON.stringify(c.schedule ?? []),
                      },
                    } as any)
                  }
                />
              ))
          ) : (
            <View className="bg-white border border-dashed border-border rounded-2xl p-6 items-center">
              <Ionicons name="book-outline" size={32} color="#CBD5E1" />
              <Text className="text-text-muted text-sm text-center mt-2 leading-5">
                Aún no has agregado cursos.{'\n'}Crea tu primera oferta.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tutor)/crear-curso' as any)}
                activeOpacity={0.85}
                className="mt-4 bg-primary rounded-full px-5 py-2.5"
              >
                <Text className="text-white text-sm font-semibold">Crear curso</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
