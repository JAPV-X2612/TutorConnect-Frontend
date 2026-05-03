import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { BookingStatus } from './SessionCard';

/**
 * Shared types, constants, and card component for the tutor sessions screen.
 *
 * @author Camilo Quintero, Jesús Pinzón, Laura Rodríguez, Santiago Díaz, Sergio Bejarano
 * @version 1.0
 * @since 2026-05-03
 */

export interface TutorBookingItem {
  id: string;
  status: BookingStatus;
  subject: string | null;
  price: number | null;
  startTime: string;
  endTime?: string;
  course?: { duration: number; modalidad: string };
  learner?: { firstName: string; lastName: string; email: string };
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pendiente',  color: '#d97706', bg: '#fef3c7' },
  confirmed: { label: 'Confirmada', color: '#16a34a', bg: '#dcfce7' },
  completed: { label: 'Completada', color: '#2563eb', bg: '#dbeafe' },
  cancelled: { label: 'Cancelada',  color: '#dc2626', bg: '#fee2e2' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

interface TutorEmptyStateProps {
  tab: BookingStatus;
}

/** Placeholder shown when the filtered tutor booking list is empty. */
export function TutorEmptyState({ tab }: TutorEmptyStateProps) {
  const messages: Record<BookingStatus, { icon: string; text: string }> = {
    pending:   { icon: 'time-outline',           text: 'No tienes solicitudes pendientes' },
    confirmed: { icon: 'calendar-outline',       text: 'No tienes sesiones confirmadas' },
    completed: { icon: 'checkmark-done-outline', text: 'Aún no has completado sesiones' },
    cancelled: { icon: 'close-circle-outline',   text: 'Sin sesiones canceladas' },
  };
  const cfg = messages[tab];
  return (
    <View className="flex-1 items-center justify-center px-6 pt-16">
      <Ionicons name={cfg.icon as any} size={48} color="#CBD5E1" />
      <Text className="text-text-muted text-base text-center mt-4">{cfg.text}</Text>
    </View>
  );
}

interface TutorBookingCardProps {
  item: TutorBookingItem;
  onAccept?: () => void;
  onReject?: () => void;
}

/** Card displaying a single booking request with accept / reject actions for the tutor. */
export function TutorBookingCard({ item, onAccept, onReject }: TutorBookingCardProps) {
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
            <Text className="text-text-muted text-xs">
              ${Number(item.price).toLocaleString('es-CO')}
            </Text>
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
