import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import { useBookingSocket } from '@/hooks/use-booking-socket';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface BookingItem {
  id: string;
  status: BookingStatus;
  subject: string | null;
  price: number | null;
  startTime: string;
  endTime?: string;
  course?: { duration: number; modalidad: string };
  learner?: { firstName: string; lastName: string; email: string };
}

const TABS: { key: BookingStatus; label: string }[] = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Historial' },
];

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pendiente',  color: '#d97706', bg: '#fef3c7' },
  confirmed: { label: 'Confirmada', color: '#16a34a', bg: '#dcfce7' },
  completed: { label: 'Completada', color: '#64748b', bg: '#f1f5f9' },
  cancelled: { label: 'Cancelada',  color: '#dc2626', bg: '#fee2e2' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function EmptyState({ tab }: { tab: BookingStatus }) {
  const messages: Record<BookingStatus, { icon: string; text: string }> = {
    pending:   { icon: 'time-outline',         text: 'No tienes solicitudes pendientes' },
    confirmed: { icon: 'calendar-outline',     text: 'No tienes sesiones confirmadas' },
    completed: { icon: 'checkmark-done-outline', text: 'Aún no has completado sesiones' },
    cancelled: { icon: 'close-circle-outline', text: 'Sin sesiones canceladas' },
  };
  const cfg = messages[tab];
  return (
    <View className="flex-1 items-center justify-center px-6 pt-16">
      <Ionicons name={cfg.icon as any} size={48} color="#CBD5E1" />
      <Text className="text-text-muted text-base text-center mt-4">{cfg.text}</Text>
    </View>
  );
}

function BookingCard({
  item,
  onAccept,
  onReject,
}: {
  item: BookingItem;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const st = STATUS_CONFIG[item.status];
  const learnerName = item.learner
    ? `${item.learner.firstName} ${item.learner.lastName}`
    : 'Estudiante';

  return (
    <View className="bg-white border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-base">{learnerName}</Text>
          <Text className="text-primary text-sm font-medium mt-0.5">{item.subject ?? '—'}</Text>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: st.bg }}>
          <Text className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-x-4 gap-y-1 mb-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={14} color="#64748B" />
          <Text className="text-text-muted text-xs">{formatDate(item.startTime)}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text className="text-text-muted text-xs">
            {formatTime(item.startTime)}
            {item.course ? ` · ${item.course.duration} min` : ''}
          </Text>
        </View>
        {item.price != null && (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="cash-outline" size={14} color="#64748B" />
            <Text className="text-text-muted text-xs">${Number(item.price).toLocaleString('es-CO')}</Text>
          </View>
        )}
      </View>

      {item.status === 'pending' && (
        <View className="flex-row gap-2 pt-3 border-t border-border">
          <TouchableOpacity
            onPress={onReject}
            activeOpacity={0.8}
            className="flex-1 py-2.5 rounded-xl border border-border items-center">
            <Text className="text-sm font-semibold text-text-muted">Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAccept}
            activeOpacity={0.8}
            className="flex-1 py-2.5 rounded-xl bg-primary items-center">
            <Text className="text-sm font-semibold text-white">Aceptar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function SesionesScreen() {
  const api = useApiRequest();
  const [activeTab, setActiveTab] = useState<BookingStatus>('pending');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const res = await api.get<BookingItem[]>(API_ENDPOINTS.tutorBookings);
    if (res.data) setBookings(res.data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  // Real-time: new requests from learners arrive instantly.
  useBookingSocket(useCallback((updated) => {
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === updated.id);
      if (exists) {
        return prev.map((b) => (b.id === updated.id ? { ...b, ...updated } as BookingItem : b));
      }
      return [updated as unknown as BookingItem, ...prev];
    });
  }, []));

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    const res = await api.patch<BookingItem>(API_ENDPOINTS.bookingStatus(id), { status });
    if (res.data) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: res.data!.status } : b)),
      );
    }
  };

  const filtered = bookings.filter((b) => b.status === activeTab);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-text-primary">Sesiones</Text>
      </View>

      <View className="flex-row px-6 mb-4 gap-2">
        {TABS.map((tab) => {
          const count = bookings.filter((b) => b.status === tab.key).length;
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
          renderItem={({ item }) => (
            <BookingCard
              item={item}
              onAccept={() => updateStatus(item.id, 'confirmed')}
              onReject={() => updateStatus(item.id, 'cancelled')}
            />
          )}
          ListEmptyComponent={<EmptyState tab={activeTab} />}
        />
      )}
    </SafeAreaView>
  );
}
