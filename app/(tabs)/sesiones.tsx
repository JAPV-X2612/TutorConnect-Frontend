import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface BookingItem {
  id: string;
  studentName: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: BookingStatus;
}

const TABS: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Historial' },
];

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7' },
  confirmed: { label: 'Confirmada', color: '#16a34a', bg: '#dcfce7' },
  completed: { label: 'Completada', color: '#64748b', bg: '#f1f5f9' },
  cancelled: { label: 'Cancelada', color: '#dc2626', bg: '#fee2e2' },
};

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, { icon: string; text: string }> = {
    pending: { icon: 'time-outline', text: 'No tienes solicitudes pendientes' },
    confirmed: { icon: 'calendar-outline', text: 'No tienes sesiones confirmadas' },
    completed: { icon: 'checkmark-done-outline', text: 'Aún no has completado sesiones' },
  };
  const config = messages[tab] ?? messages.pending;

  return (
    <View className="flex-1 items-center justify-center px-6 pt-16">
      <Ionicons name={config.icon as any} size={48} color="#CBD5E1" />
      <Text className="text-text-muted text-base text-center mt-4">{config.text}</Text>
    </View>
  );
}

function BookingCard({ item, onAccept, onReject }: { item: BookingItem; onAccept?: () => void; onReject?: () => void }) {
  const status = STATUS_CONFIG[item.status];
  return (
    <View className="bg-white border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-base">{item.studentName}</Text>
          <Text className="text-primary text-sm font-medium mt-0.5">{item.subject}</Text>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: status.bg }}>
          <Text className="text-xs font-semibold" style={{ color: status.color }}>{status.label}</Text>
        </View>
      </View>

      <View className="flex-row gap-4 mb-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={14} color="#64748B" />
          <Text className="text-text-muted text-xs">{item.date}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text className="text-text-muted text-xs">{item.time} · {item.duration} min</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="cash-outline" size={14} color="#64748B" />
          <Text className="text-text-muted text-xs">${item.price.toLocaleString('es-CO')}</Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View className="flex-row gap-2 pt-3 border-t border-border">
          <TouchableOpacity onPress={onReject} activeOpacity={0.8}
            className="flex-1 py-2.5 rounded-xl border border-border items-center">
            <Text className="text-sm font-semibold text-text-muted">Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAccept} activeOpacity={0.8}
            className="flex-1 py-2.5 rounded-xl bg-primary items-center">
            <Text className="text-sm font-semibold text-white">Aceptar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function SesionesScreen() {
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  const filtered = bookings.filter((b) => b.status === activeTab);

  const handleAccept = (id: string) =>
    setBookings((p) => p.map((b) => b.id === id ? { ...b, status: 'confirmed' } : b));

  const handleReject = (id: string) =>
    setBookings((p) => p.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-text-primary">Sesiones</Text>
      </View>

      {/* Tab selector */}
      <View className="flex-row px-6 mb-4 gap-2">
        {TABS.map((tab) => {
          const count = bookings.filter((b) => b.status === tab.key).length;
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}
              className={`flex-1 py-2 rounded-full items-center border ${active ? 'bg-primary border-primary' : 'bg-white border-border'}`}>
              <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-text-muted'}`}>
                {tab.label}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
        renderItem={({ item }) => (
          <BookingCard item={item} onAccept={() => handleAccept(item.id)} onReject={() => handleReject(item.id)} />
        )}
        ListEmptyComponent={<EmptyState tab={activeTab} />}
      />
    </SafeAreaView>
  );
}
