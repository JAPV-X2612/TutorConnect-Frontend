import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * Shared types, constants, helpers, and card component for the learner sessions screen.
 *
 * @author Camilo Quintero, Jesús Pinzón, Laura Rodríguez, Santiago Díaz, Sergio Bejarano
 * @version 1.0
 * @since 2026-05-03
 */

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingItem {
  id: string;
  status: BookingStatus;
  subject: string | null;
  price: number | null;
  startTime: string;
  endTime?: string;
  course?: { id: string; subject: string; duration: number; modalidad: string };
  tutor?: { id: string; clerkId: string; nombre: string; apellido: string };
}

export const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', icon: 'time-outline' },
  confirmed: {
    label: 'Confirmada',
    color: '#16a34a',
    bg: '#dcfce7',
    icon: 'checkmark-circle-outline',
  },
  completed: {
    label: 'Completada',
    color: '#64748b',
    bg: '#f1f5f9',
    icon: 'checkmark-done-outline',
  },
  cancelled: {
    label: 'Cancelada',
    color: '#dc2626',
    bg: '#fee2e2',
    icon: 'close-circle-outline',
  },
};

/** Returns YYYY-MM-DD in the device's local timezone. */
export function toLocalDateString(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

interface EmptyStateProps {
  tab: BookingStatus;
}

/** Placeholder shown when the filtered list has no sessions. */
export function EmptyState({ tab }: EmptyStateProps) {
  const messages: Record<BookingStatus, { icon: string; text: string; sub: string }> = {
    pending: {
      icon: 'time-outline',
      text: 'Sin solicitudes pendientes',
      sub: 'Reserva una sesión desde el inicio',
    },
    confirmed: {
      icon: 'calendar-outline',
      text: 'Sin sesiones confirmadas',
      sub: 'El tutor aún no ha aceptado tu solicitud',
    },
    completed: {
      icon: 'checkmark-done-outline',
      text: 'Sin sesiones completadas',
      sub: 'Aquí aparecerán tus sesiones pasadas',
    },
    cancelled: { icon: 'close-circle-outline', text: 'Sin sesiones canceladas', sub: '' },
  };
  const cfg = messages[tab];
  return (
    <View className="flex-1 items-center justify-center px-6 pt-16">
      <Ionicons name={cfg.icon as any} size={52} color="#CBD5E1" />
      <Text className="text-text-primary font-semibold text-base text-center mt-4">
        {cfg.text}
      </Text>
      {cfg.sub ? (
        <Text className="text-text-muted text-sm text-center mt-1">{cfg.sub}</Text>
      ) : null}
    </View>
  );
}

interface SessionCardProps {
  item: BookingItem;
  onCancel?: () => void;
  onChat?: () => void;
  onRate?: () => void;
  onReschedule?: () => void;
  isRated?: boolean;
}

/** Card displaying a single booking with its status-aware actions. */
export function SessionCard({
  item,
  onCancel,
  onChat,
  onRate,
  onReschedule,
  isRated = false,
}: SessionCardProps) {
  const st = STATUS_CONFIG[item.status];
  const tutorName = item.tutor ? `${item.tutor.nombre} ${item.tutor.apellido}` : 'Tutor';
  const isActive = item.status === 'pending' || item.status === 'confirmed';

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
          <Text className="text-xs font-semibold" style={{ color: st.color }}>
            {st.label}
          </Text>
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

      {/* Actions — active sessions */}
      {isActive && (
        <View className="mt-3 gap-2">
          {/* Primary row: Chat (confirmed only) + Reschedule */}
          <View className="flex-row gap-2">
            {item.status === 'confirmed' && onChat && (
              <TouchableOpacity
                onPress={onChat}
                activeOpacity={0.8}
                className="flex-1 py-2.5 rounded-xl bg-primary/10 flex-row items-center justify-center gap-1.5">
                <Ionicons name="chatbubble-outline" size={15} color="#006A75" />
                <Text className="text-sm font-semibold text-primary">Chatear</Text>
              </TouchableOpacity>
            )}
            {onReschedule && (
              <TouchableOpacity
                onPress={onReschedule}
                activeOpacity={0.8}
                className="flex-1 py-2.5 rounded-xl bg-primary/10 flex-row items-center justify-center gap-1.5">
                <Ionicons name="calendar-outline" size={15} color="#006A75" />
                <Text className="text-sm font-semibold text-primary">Reprogramar</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Secondary: Cancel */}
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.8}
            className="py-2.5 rounded-xl border border-border items-center">
            <Text className="text-sm font-semibold text-text-muted">Cancelar sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Actions — completed sessions */}
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
          <Text className={`text-sm font-semibold ${isRated ? 'text-text-muted' : 'text-primary'}`}>
            {isRated ? 'Calificada' : 'Calificar sesión'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
