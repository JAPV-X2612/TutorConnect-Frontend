import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { BookingItem, formatDate, formatTime, toLocalDateString } from './SessionCard';

/**
 * Modal that lets a learner pick a new date and time slot for an existing booking.
 *
 * Time slots are generated every 30 minutes from 06:00 to 22:00.
 * The backend validates conflicts after submission.
 *
 * @author Camilo Quintero, Jesús Pinzón, Laura Rodríguez, Santiago Díaz, Sergio Bejarano
 * @version 1.0
 * @since 2026-05-03
 */

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();

function todayString(): string {
  return toLocalDateString(new Date().toISOString());
}

interface RescheduleModalProps {
  visible: boolean;
  booking: BookingItem | null;
  onClose: () => void;
  onConfirm: (newStartTime: string) => Promise<void>;
}

export function RescheduleModal({ visible, booking, onClose, onConfirm }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentDateStr = booking ? toLocalDateString(booking.startTime) : null;
  const currentTimeStr = booking ? formatTime(booking.startTime) : null;

  const markedDates = useMemo(() => {
    if (!selectedDate) return {};
    return { [selectedDate]: { selected: true, selectedColor: '#006A75' } };
  }, [selectedDate]);

  const canConfirm = selectedDate !== null && selectedTime !== null;

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    // Construct ISO string in local timezone (no Z suffix → interpreted as local).
    const iso = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
    await onConfirm(iso);
    setLoading(false);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 bg-white border-b border-border">
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text className="text-text-primary font-bold text-base">Reprogramar sesión</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Current session info */}
          {booking && (
            <View className="mx-6 mt-5 p-4 bg-white border border-border rounded-2xl gap-1">
              <Text className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-1">
                Sesión actual
              </Text>
              <Text className="text-text-primary font-bold text-sm">
                {booking.subject ?? booking.course?.subject ?? 'Sesión'}
              </Text>
              <Text className="text-text-muted text-sm capitalize">
                {formatDate(booking.startTime)} · {currentTimeStr}
              </Text>
            </View>
          )}

          {/* Date picker */}
          <View className="mx-6 mt-5 bg-white border border-border rounded-2xl overflow-hidden">
            <Text className="px-4 pt-4 pb-2 text-text-primary font-semibold text-sm">
              Selecciona una fecha
            </Text>
            <Calendar
              minDate={todayString()}
              markedDates={markedDates}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              theme={{
                todayTextColor: '#006A75',
                selectedDayBackgroundColor: '#006A75',
                selectedDayTextColor: '#ffffff',
                arrowColor: '#006A75',
                monthTextColor: '#1e293b',
                textDayFontSize: 14,
                textMonthFontSize: 15,
                textMonthFontWeight: '600',
                textDayHeaderFontSize: 12,
                dayTextColor: '#334155',
                textDisabledColor: '#CBD5E1',
                calendarBackground: '#ffffff',
              }}
            />
          </View>

          {/* Time slots */}
          {selectedDate && (
            <View className="mx-6 mt-5 p-4 bg-white border border-border rounded-2xl">
              <Text className="text-text-primary font-semibold text-sm mb-3">
                Selecciona una hora
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isCurrent =
                    selectedDate === currentDateStr && slot === currentTimeStr;
                  const isSelected = slot === selectedTime;
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setSelectedTime(slot)}
                      activeOpacity={0.8}
                      className={`px-3 py-2 rounded-xl border ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : isCurrent
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-background border-border'
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected
                            ? 'text-white'
                            : isCurrent
                              ? 'text-amber-600'
                              : 'text-text-primary'
                        }`}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Confirm button */}
        <View className="px-6 pb-8 pt-4 bg-white border-t border-border">
          {booking?.status === 'confirmed' && (
            <Text className="text-text-muted text-xs text-center mb-3">
              Al reprogramar una sesión confirmada, el tutor deberá aceptar el nuevo horario.
            </Text>
          )}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!canConfirm || loading}
            activeOpacity={0.8}
            className={`py-3.5 rounded-full items-center ${
              canConfirm && !loading ? 'bg-primary' : 'bg-primary/40'
            }`}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-sm">Confirmar reprogramación</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
