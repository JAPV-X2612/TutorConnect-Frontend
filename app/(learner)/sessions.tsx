import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import { useBookingSocket } from '@/hooks/use-booking-socket';
import { RateSessionModal } from '@/components/features/review/RateSessionModal';
import {
  BookingItem,
  BookingStatus,
  EmptyState,
  SessionCard,
  toLocalDateString,
} from '@/components/features/sessions/SessionCard';
import { SessionCalendar } from '@/components/features/sessions/SessionCalendar';

/**
 * Learner sessions screen — list and calendar views for all bookings.
 *
 * Reschedule feature is temporarily disabled pending proper tutor-availability
 * validation and a two-step confirmation flow. The RescheduleModal component
 * and backend endpoint are ready for future activation.
 *
 * @author Camilo Quintero, Jesús Pinzón, Laura Rodríguez, Santiago Díaz, Sergio Bejarano
 * @version 2.0
 * @since 2026-05-03
 */

type ViewMode = 'list' | 'calendar';

const TABS: { key: BookingStatus; label: string }[] = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Historial' },
];

export default function LearnerSessionsScreen() {
  const api = useApiRequest();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<BookingStatus>('pending');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  useBookingSocket(
    useCallback((updated) => {
      setBookings((prev) => {
        const exists = prev.some((b) => b.id === updated.id);
        if (exists)
          return prev.map((b) =>
            b.id === updated.id ? ({ ...b, ...updated } as BookingItem) : b,
          );
        return [updated as unknown as BookingItem, ...prev];
      });
    }, []),
  );

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
    if (!res.error) router.push('/(learner)/mensajes' as any);
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const historyCount = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled',
  ).length;

  const listFiltered = useMemo(
    () =>
      bookings.filter((b) => {
        if (activeTab === 'completed')
          return b.status === 'completed' || b.status === 'cancelled';
        return b.status === activeTab;
      }),
    [bookings, activeTab],
  );

  const calendarFiltered = useMemo(
    () =>
      selectedDate
        ? bookings.filter((b) => toLocalDateString(b.startTime) === selectedDate)
        : bookings,
    [bookings, selectedDate],
  );

  const ratingTutorName = useMemo(() => {
    const b = bookings.find((it) => it.id === ratingBookingId);
    return b?.tutor ? `${b.tutor.nombre} ${b.tutor.apellido}` : undefined;
  }, [ratingBookingId, bookings]);

  const renderCard = ({ item }: { item: BookingItem }) => (
    <SessionCard
      item={item}
      onCancel={cancelling === item.id ? undefined : () => handleCancel(item.id)}
      onChat={
        item.tutor?.clerkId
          ? () => handleChat(item.tutor!.clerkId, item.course?.id)
          : undefined
      }
      onRate={item.status === 'completed' ? () => setRatingBookingId(item.id) : undefined}
      isRated={ratedBookingIds.has(item.id)}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-text-primary">Mis sesiones</Text>
          {(pendingCount > 0 || confirmedCount > 0) && (
            <Text className="text-text-muted text-sm mt-0.5">
              {confirmedCount > 0
                ? `${confirmedCount} confirmada${confirmedCount > 1 ? 's' : ''}`
                : ''}
              {confirmedCount > 0 && pendingCount > 0 ? ' · ' : ''}
              {pendingCount > 0
                ? `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`
                : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => {
            setViewMode((m) => (m === 'list' ? 'calendar' : 'list'));
            setSelectedDate(null);
          }}
          activeOpacity={0.7}
          className="ml-3 p-2 rounded-xl bg-white border border-border">
          <Ionicons
            name={viewMode === 'list' ? 'calendar-outline' : 'list-outline'}
            size={20}
            color="#006A75"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#006A75" />
        </View>
      ) : viewMode === 'list' ? (
        <>
          {/* Tab filters */}
          <View className="flex-row px-6 mb-4 gap-2">
            {TABS.map((tab) => {
              const count =
                tab.key === 'completed'
                  ? historyCount
                  : tab.key === 'confirmed'
                    ? confirmedCount
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
                  <Text
                    className={`text-xs font-semibold ${active ? 'text-white' : 'text-text-muted'}`}>
                    {tab.label}
                    {count > 0 ? ` (${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <FlatList
            data={listFiltered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#006A75"
              />
            }
            renderItem={renderCard}
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
        </>
      ) : (
        <>
          {/* Calendar view */}
          <View className="mx-6 mb-3 bg-white border border-border rounded-2xl overflow-hidden">
            <SessionCalendar
              bookings={bookings}
              selectedDate={selectedDate}
              onDayPress={(date) => setSelectedDate((prev) => (prev === date ? null : date))}
            />
          </View>
          {selectedDate && (
            <Text className="px-6 pb-2 text-text-muted text-xs">
              {calendarFiltered.length} sesión{calendarFiltered.length !== 1 ? 'es' : ''} el{' '}
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          )}
          <FlatList
            data={calendarFiltered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#006A75"
              />
            }
            renderItem={renderCard}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center pt-12">
                <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                <Text className="text-text-primary font-semibold text-base mt-4">
                  {selectedDate
                    ? 'Sin sesiones este día'
                    : 'Toca un día para ver tus sesiones'}
                </Text>
              </View>
            }
          />
        </>
      )}

      <RateSessionModal
        visible={ratingBookingId !== null}
        bookingId={ratingBookingId}
        tutorName={ratingTutorName}
        onClose={() => setRatingBookingId(null)}
        onSubmitted={() => {
          if (ratingBookingId)
            setRatedBookingIds((prev) => new Set(prev).add(ratingBookingId));
        }}
      />
    </SafeAreaView>
  );
}
