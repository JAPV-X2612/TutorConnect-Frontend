import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
import { BookingStatus, toLocalDateString } from '@/components/features/sessions/SessionCard';
import { SessionCalendar } from '@/components/features/sessions/SessionCalendar';
import {
  TutorBookingCard,
  TutorBookingItem,
  TutorEmptyState,
} from '@/components/features/sessions/TutorBookingCard';

/**
 * Tutor sessions screen — list and calendar views for all incoming bookings.
 *
 * @author Camilo Quintero, Jesús Pinzón, Laura Rodríguez, Santiago Díaz, Sergio Bejarano
 * @version 2.0
 * @since 2026-05-03
 */

type ViewMode = 'list' | 'calendar';

const TABS: { key: BookingStatus; label: string }[] = [
  { key: 'pending',   label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Historial' },
];

export default function TutorSessionsScreen() {
  const api = useApiRequest();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<BookingStatus>('pending');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookings, setBookings] = useState<TutorBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await api.get<TutorBookingItem[]>(API_ENDPOINTS.tutorBookings);
    if (Array.isArray(res.data)) setBookings(res.data);
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
            b.id === updated.id ? ({ ...b, ...updated } as TutorBookingItem) : b,
          );
        return [updated as unknown as TutorBookingItem, ...prev];
      });
    }, []),
  );

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    const res = await api.patch<TutorBookingItem>(API_ENDPOINTS.bookingStatus(id), { status });
    if (res.data) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: res.data!.status } : b)),
      );
    }
  };

  const pendingCount   = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const historyCount   = bookings.filter(
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

  const renderCard = ({ item }: { item: TutorBookingItem }) => (
    <TutorBookingCard
      item={item}
      onAccept={() => updateStatus(item.id, 'confirmed')}
      onReject={() => updateStatus(item.id, 'cancelled')}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-text-primary">Sesiones</Text>
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
                    className={`text-xs font-semibold ${
                      active ? 'text-white' : 'text-text-muted'
                    }`}>
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
            ListEmptyComponent={<TutorEmptyState tab={activeTab} />}
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
    </SafeAreaView>
  );
}
