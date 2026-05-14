import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';


const DAY_TO_JS: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié',
  THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb', SUNDAY: 'Dom',
};

const MONTH_NAMES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface CourseDetail {
  id: string;
  subject: string;
  price: number;
  duration: number;
  modalidad: string;
  schedule: ScheduleSlot[];
  tutor: { id: string; nombre: string; apellido: string };
}

interface DateOption {
  iso: string;       // ISO datetime: the scheduledAt value
  label: string;     // "lun 2 abr"
  slot: ScheduleSlot;
}

function buildDateOptions(schedule: ScheduleSlot[]): DateOption[] {
  if (!schedule || schedule.length === 0) return [];

  const allowedDays = new Set(schedule.map((s) => DAY_TO_JS[s.day]));
  const options: DateOption[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 1; offset <= 28; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    if (!allowedDays.has(d.getDay())) continue;

    const dayKey = Object.keys(DAY_TO_JS).find((k) => DAY_TO_JS[k] === d.getDay())!;
    const slot = schedule.find((s) => s.day === dayKey)!;

    const [h, m] = slot.startTime.split(':').map(Number);
    const dt = new Date(d);
    dt.setHours(h, m, 0, 0);

    const dayLabel = DAY_LABELS[dayKey] ?? dayKey;
    const label = `${dayLabel} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;

    options.push({ iso: dt.toISOString(), label, slot });
  }

  return options;
}

export default function BookingScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const api = useApiRequest();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [selected, setSelected] = useState<DateOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setSelected(null);
      setError(null);
      setSubmitting(false);

      if (!courseId) return;
      setLoading(true);
      api.get<CourseDetail>(API_ENDPOINTS.courseDetail(courseId)).then((res) => {
        if (res.error || !res.data) {
          setError('No se pudo cargar el curso.');
        } else {
          setCourse(res.data);
          setDateOptions(buildDateOptions(res.data.schedule));
        }
        setLoading(false);
      });
    }, [courseId]),
  );

  const handleConfirm = async () => {
    if (!selected || !courseId || !course) return;
    setSubmitting(true);
    setError(null);
    const res = await api.post<{ id: string }>(API_ENDPOINTS.bookings, {
      courseId,
      scheduledAt: selected.iso,
    });
    setSubmitting(false);
    if (res.error || !res.data?.id) {
      setError('No se pudo crear la reserva. Inténtalo de nuevo.');
      return;
    }
    router.push({
      pathname: '/(learner)/payment/[bookingId]' as any,
      params: {
        bookingId: res.data.id,
        subject: course.subject,
        tutorName: `${course.tutor.nombre} ${course.tutor.apellido}`,
        price: String(course.price),
        duration: String(course.duration),
        scheduledAt: selected.iso,
        timeRange: `${selected.slot.startTime} – ${selected.slot.endTime}`,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#006A75" />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-red-600 text-center mb-4">{error ?? 'Curso no encontrado'}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary rounded-full px-6 py-3">
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Nav */}
      <View className="flex-row items-center px-4 py-2 border-b border-border gap-2">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-text-primary flex-1">Reservar sesión</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Course summary */}
        <View className="mx-6 mt-5 mb-4 bg-white border border-border rounded-2xl p-4">
          <Text className="text-text-primary font-bold text-lg mb-0.5">{course.subject}</Text>
          <Text className="text-text-muted text-sm mb-3">
            {course.tutor.nombre} {course.tutor.apellido}
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={14} color="#006A75" />
              <Text className="text-text-muted text-xs">{course.duration} min</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="laptop-outline" size={14} color="#006A75" />
              <Text className="text-text-muted text-xs">{course.modalidad}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="cash-outline" size={14} color="#006A75" />
              <Text className="text-text-muted text-xs">
                ${course.price.toLocaleString('es-CO')} COP
              </Text>
            </View>
          </View>
        </View>

        {/* Date picker */}
        <View className="px-6 mb-3">
          <Text className="text-text-primary font-semibold text-sm mb-1">
            Elige una fecha
          </Text>
          <Text className="text-text-muted text-xs">
            Próximas fechas disponibles según el horario del tutor
          </Text>
        </View>

        {dateOptions.length === 0 ? (
          <View className="mx-6 bg-white border border-border rounded-2xl p-6 items-center">
            <Ionicons name="calendar-outline" size={32} color="#CBD5E1" />
            <Text className="text-text-muted text-sm text-center mt-3">
              El tutor aún no ha configurado horarios para este curso.
            </Text>
          </View>
        ) : (
          <FlatList
            data={dateOptions}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.iso}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
            renderItem={({ item }) => {
              const active = selected?.iso === item.iso;
              return (
                <TouchableOpacity
                  onPress={() => setSelected(item)}
                  activeOpacity={0.8}
                  className={`px-4 py-3 rounded-2xl border items-center min-w-[80px] ${
                    active
                      ? 'bg-primary border-primary'
                      : 'bg-white border-border'
                  }`}
                >
                  <Text className={`text-xs font-semibold mb-1 ${active ? 'text-white' : 'text-text-muted'}`}>
                    {item.label.split(' ')[0]}
                  </Text>
                  <Text className={`text-lg font-bold leading-tight ${active ? 'text-white' : 'text-text-primary'}`}>
                    {item.label.split(' ')[1]}
                  </Text>
                  <Text className={`text-xs mt-0.5 ${active ? 'text-white/80' : 'text-text-muted'}`}>
                    {item.label.split(' ')[2]}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Selected slot detail */}
        {selected && (
          <View className="mx-6 mt-4 bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="calendar-outline" size={16} color="#006A75" />
              <Text className="text-primary font-semibold text-sm">Sesión seleccionada</Text>
            </View>
            <Text className="text-text-primary text-sm font-medium capitalize">
              {selected.label}
            </Text>
            <Text className="text-text-muted text-xs mt-0.5">
              {selected.slot.startTime} – {selected.slot.endTime}
            </Text>
          </View>
        )}

        {error && (
          <Text className="text-red-600 text-sm text-center px-6 mt-4">{error}</Text>
        )}

      </ScrollView>

      {/* CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-background border-t border-border">
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!selected || submitting}
          className={`rounded-full py-4 items-center ${selected && !submitting ? 'bg-primary' : 'bg-gray-200'}`}
          onPress={handleConfirm}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`font-semibold text-base ${selected ? 'text-white' : 'text-gray-400'}`}>
              {selected
                ? `Confirmar reserva — $${course.price.toLocaleString('es-CO')} COP`
                : 'Selecciona una fecha'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
