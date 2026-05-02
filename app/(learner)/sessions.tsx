import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import { useBookingSocket } from '@/hooks/use-booking-socket';
import { RateSessionModal } from '@/components/features/review/RateSessionModal';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface BookingItem {
  id: string;
  status: BookingStatus;
  subject: string | null;
  price: number | null;
  startTime: string;
  endTime?: string;
  course?: { id: string; subject: string; duration: number; modalidad: string };
  tutor?: { id: string; clerkId: string; nombre: string; apellido: string };
}

const TABS: { key: BookingStatus; label: string }[] = [
  { key: 'pending',   label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Historial' },
];

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'Pendiente',  color: '#d97706', bg: '#fef3c7', icon: 'time-outline' },
  confirmed: { label: 'Confirmada', color: '#16a34a', bg: '#dcfce7', icon: 'checkmark-circle-outline' },
  completed: { label: 'Completada', color: '#64748b', bg: '#f1f5f9', icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelada',  color: '#dc2626', bg: '#fee2e2', icon: 'close-circle-outline' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function EmptyState({ tab }: { tab: BookingStatus }) {
  const messages: Record<BookingStatus, { icon: string; text: string; sub: string }> = {
    pending:   { icon: 'time-outline',           text: 'Sin solicitudes pendientes', sub: 'Reserva una sesión desde el inicio' },
    confirmed: { icon: 'calendar-outline',       text: 'Sin sesiones confirmadas',   sub: 'El tutor aún no ha aceptado tu solicitud' },
    completed: { icon: 'checkmark-done-outline', text: 'Sin sesiones completadas',   sub: 'Aquí aparecerán tus sesiones pasadas' },
    cancelled: { icon: 'close-circle-outline',   text: 'Sin sesiones canceladas',    sub: '' },
  };
  const cfg = messages[tab];
  return (
    <View className="flex-1 items-center justify-center px-6 pt-16">
      <Ionicons name={cfg.icon as any} size={52} color="#CBD5E1" />
      <Text className="text-text-primary font-semibold text-base text-center mt-4">{cfg.text}</Text>
      {cfg.sub ? <Text className="text-text-muted text-sm text-center mt-1">{cfg.sub}</Text> : null}
    </View>
  );
}

function SessionCard({
  item,
  onCancel,
  onChat,
  onRate,
  isRated = false,
}: {
  item: BookingItem;
  onCancel?: () => void;
  onChat?: () => void;
  onRate?: () => void;
  isRated?: boolean;
}) {
  const st = STATUS_CONFIG[item.status];
  const tutorName = item.tutor ? `${item.tutor.nombre} ${item.tutor.apellido}` : 'Tutor';

  return (
    <View className="bg-white border border-border rounded-2xl p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-text-primary font-bold text-base leading-snug">
            {item.subject ?? item.course?.subject ?? 'Sesión'}
          </Text>
          <Text className="text-text-muted text-sm mt-0.5">{tutorName}</Text>
        </View>
        <View className="rounded-full px-3 py-1 flex-shrink-0" style={{ backgroundColor: st.bg }}>
          <Text className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</Text>
        </View>
      </View>

      {/* Details */}
      <View className="bg-background rounded-xl p-3 gap-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={15} color="#006A75" />
          <Text className="text-text-primary text-sm capitalize">{formatDate(item.startTime)}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={15} color="#006A75" />
          <Text className="text-text-primary text-sm">
            {formatTime(item.startTime)}
            {item.course ? ` · ${item.course.duration} min` : ''}
          </Text>
        </View>
        {item.course && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="laptop-outline" size={15} color="#006A75" />
            <Text className="text-text-primary text-sm">{item.course.modalidad}</Text>
          </View>
        )}
        {item.price != null && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="cash-outline" size={15} color="#006A75" />
            <Text className="text-text-primary text-sm">
              ${Number(item.price).toLocaleString('es-CO')} COP
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {(item.status === 'pending' || item.status === 'confirmed') && (
        <View className="mt-3 flex-row gap-2">
          {item.status === 'confirmed' && onChat && (
            <TouchableOpacity
              onPress={onChat}
              activeOpacity={0.8}
              className="flex-1 py-2.5 rounded-xl bg-primary/10 flex-row items-center justify-center gap-1.5">
              <Ionicons name="chatbubble-outline" size={15} color="#006A75" />
              <Text className="text-sm font-semibold text-primary">Chatear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.8}
            className="flex-1 py-2.5 rounded-xl border border-border items-center">
            <Text className="text-sm font-semibold text-text-muted">Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'completed' && onRate && (
        <TouchableOpacity
          onPress={onRate}
          activeOpacity={0.8}
          accessibilityLabel={isRated ? 'Ver tu calificación' : 'Calificar sesión'}
          className={`mt-3 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
            isRated ? 'bg-secondary/40' : 'bg-primary/10'
          }`}>
          <Ionicons
            name={isRated ? 'star' : 'star-outline'}
            size={15}
            color={isRated ? '#F59E0B' : '#006A75'}
          />
          <Text
            className={`text-sm font-semibold ${
              isRated ? 'text-text-muted' : 'text-primary'
            }`}>
            {isRated ? 'Calificada' : 'Calificar sesión'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function LearnerSessionsScreen() {
  const api = useApiRequest();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BookingStatus>('pending');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratedBookingIds, setRatedBookingIds] = useState<Set<string>>(new Set());

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [bookingsRes, reviewsRes] = await Promise.all([
      api.get<BookingItem[]>(API_ENDPOINTS.myBookings),
      api.get<{ bookingId: string }[]>(API_ENDPOINTS.myReviews),
    ]);
    if (bookingsRes.data) setBookings(bookingsRes.data);
    if (Array.isArray(reviewsRes.data)) {
      setRatedBookingIds(new Set(reviewsRes.data.map((r) => r.bookingId)));
    }
    if (!silent) setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings(true);
    setRefreshing(false);
  }, [loadBookings]);

  // Initial load + refresh on every tab focus.
  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  // Real-time: patch the booking in state when the socket pushes an update.
  useBookingSocket(useCallback((updated) => {
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === updated.id);
      if (exists) {
        return prev.map((b) => (b.id === updated.id ? { ...b, ...updated } as BookingItem : b));
      }
      // New booking created elsewhere — prepend it.
      return [updated as unknown as BookingItem, ...prev];
    });
  }, []));

  const handleCancel = async (id: string) => {
    setCancelling(id);
    const res = await api.patch<BookingItem>(API_ENDPOINTS.cancelBooking(id));
    setCancelling(null);
    if (res.data) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: res.data!.status } : b)),
      );
    }
  };

  const handleChat = async (tutorClerkId: string, courseId?: string) => {
    const res = await api.post(API_ENDPOINTS.messagingChannels, {
      otherClerkId: tutorClerkId,
      ...(courseId && { courseId }),
    });
    if (!res.error) {
      router.push('/(learner)/mensajes' as any);
    }
  };

  const ratingTutorName = useMemo(() => {
    if (!ratingBookingId) return undefined;
    const b = bookings.find((it) => it.id === ratingBookingId);
    return b?.tutor ? `${b.tutor.nombre} ${b.tutor.apellido}` : undefined;
  }, [ratingBookingId, bookings]);

  const pendingCount   = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const historyCount   = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled').length;
  const filtered = bookings.filter((b) => {
    if (activeTab === 'completed') return b.status === 'completed' || b.status === 'cancelled';
    return b.status === activeTab;
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-3">
        <Text className="text-2xl font-bold text-text-primary">Mis sesiones</Text>
        {(pendingCount > 0 || confirmedCount > 0) && (
          <Text className="text-text-muted text-sm mt-0.5">
            {confirmedCount > 0 ? `${confirmedCount} confirmada${confirmedCount > 1 ? 's' : ''}` : ''}
            {confirmedCount > 0 && pendingCount > 0 ? ' · ' : ''}
            {pendingCount > 0 ? `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` : ''}
          </Text>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 mb-4 gap-2">
        {TABS.map((tab) => {
          const count =
            tab.key === 'completed' ? historyCount
            : tab.key === 'confirmed' ? confirmedCount
            : pendingCount;
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
              className={`flex-1 py-2 rounded-full items-center border ${
                active ? 'bg-primary border-primary' : 'bg-white border-border'
              }`}>
              <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-text-muted'}`}>
                {tab.label}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#006A75" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#006A75" />
          }
          renderItem={({ item }) => (
            <SessionCard
              item={item}
              onCancel={cancelling === item.id ? undefined : () => handleCancel(item.id)}
              onChat={item.tutor?.clerkId ? () => handleChat(item.tutor!.clerkId, item.course?.id) : undefined}
              onRate={item.status === 'completed' ? () => setRatingBookingId(item.id) : undefined}
              isRated={ratedBookingIds.has(item.id)}
            />
          )}
          ListEmptyComponent={<EmptyState tab={activeTab} />}
          ListFooterComponent={
            bookings.length === 0 && !loading ? (
              <TouchableOpacity
                onPress={() => router.replace('/(learner)/dashboard' as any)}
                className="mt-4 bg-primary rounded-full py-3 items-center">
                <Text className="text-white font-semibold">Explorar cursos</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <RateSessionModal
        visible={ratingBookingId !== null}
        bookingId={ratingBookingId}
        tutorName={ratingTutorName}
        onClose={() => setRatingBookingId(null)}
        onSubmitted={() => {
          if (ratingBookingId) {
            setRatedBookingIds((prev) => new Set(prev).add(ratingBookingId));
          }
        }}
      />
    </SafeAreaView>
  );
}
