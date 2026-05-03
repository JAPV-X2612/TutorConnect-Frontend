import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

const AVATAR_COLORS = ['#006A75', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves', FRIDAY: 'Viernes', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
};

interface CourseDetail {
  id: string;
  subject: string;
  description?: string;
  price: number;
  duration: number;
  modalidad: string;
  academicLevel?: string;
  experienceYears?: number;
  schedule: { day: string; startTime: string; endTime: string }[];
  tutor: {
    id: string;
    clerkId: string;
    nombre: string;
    apellido: string;
    bio?: string;
    rating?: number;
    disponible: boolean;
    subjects?: string[];
    email?: string;
    city?: string;
    certificaciones: { id: string; nombreArchivo: string; mimeType: string }[];
  };
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="mx-6 mb-4 bg-white border border-border rounded-2xl overflow-hidden">
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border last:border-0">
      <Ionicons name={icon as any} size={16} color="#006A75" />
      <View className="flex-1">
        <Text className="text-text-muted text-xs mb-0.5">{label}</Text>
        <Text className="text-text-primary text-sm font-medium">{value}</Text>
      </View>
    </View>
  );
}

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const api = useApiRequest();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const handleConsultar = async () => {
    if (!course?.tutor?.clerkId) return;
    setChatLoading(true);
    const res = await api.post<{ id: number }>(API_ENDPOINTS.messagingChannels, {
      otherClerkId: course.tutor.clerkId,
      courseId,
    });
    setChatLoading(false);
    if (res.data?.id) {
      router.push({
        pathname: '/(learner)/mensajes',
        params: { channelId: String(res.data.id) },
      } as any);
    } else {
      router.push('/(learner)/mensajes' as any);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    api.get<CourseDetail>(API_ENDPOINTS.courseDetail(courseId)).then((res) => {
      if (res.error || !res.data) setError('No se pudo cargar el curso.');
      else setCourse(res.data);
      setLoading(false);
    });
  }, [courseId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#006A75" />
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-red-600 text-center mb-4">{error ?? 'Curso no encontrado'}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary rounded-full px-6 py-3">
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initials = `${course.tutor.nombre.charAt(0)}${course.tutor.apellido.charAt(0)}`.toUpperCase();
  const color = avatarColor(course.tutor.nombre);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Nav */}
      <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-text-primary flex-1" numberOfLines={1}>
          {course.subject}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Curso ── */}
        <View className="px-6 pt-5 pb-2">
          <Text className="text-2xl font-bold text-text-primary mb-1">{course.subject}</Text>
          {course.description ? (
            <Text className="text-text-muted text-sm leading-6">{course.description}</Text>
          ) : null}
        </View>

        <SectionCard>
          <InfoRow icon="cash-outline"   label="Precio por sesión" value={`$${course.price.toLocaleString('es-CO')} COP`} />
          <InfoRow icon="time-outline"   label="Duración"          value={`${course.duration} min`} />
          <InfoRow icon="laptop-outline" label="Modalidad"         value={course.modalidad} />
          {course.academicLevel ? (
            <InfoRow icon="school-outline" label="Nivel requerido" value={course.academicLevel} />
          ) : null}
        </SectionCard>

        {/* ── Horario ── */}
        {course.schedule.length > 0 && (
          <SectionCard>
            <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
              <Ionicons name="calendar-outline" size={16} color="#006A75" />
              <Text className="text-text-primary font-semibold text-sm">Horario disponible</Text>
            </View>
            {course.schedule.map((slot, i) => (
              <View key={i} className="flex-row items-center justify-between px-4 py-3 border-t border-border">
                <Text className="text-text-primary text-sm font-medium">
                  {DAY_LABELS[slot.day] ?? slot.day}
                </Text>
                <Text className="text-primary text-sm font-semibold">
                  {slot.startTime} – {slot.endTime}
                </Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* ── Tutor ── */}
        <View className="px-6 mb-2">
          <Text className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-3">
            Sobre el tutor
          </Text>
        </View>

        {/* Avatar + nombre */}
        <View className="mx-6 mb-4 bg-white border border-border rounded-2xl p-5">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: color }}>
              <Text className="text-white text-2xl font-bold">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-bold text-xl">
                {course.tutor.nombre} {course.tutor.apellido}
              </Text>
              <View className="flex-row items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                {course.tutor.rating != null && (
                  <View className="flex-row items-center gap-1">
                    <Text className="text-yellow-500">★</Text>
                    <Text className="text-text-muted text-sm">{course.tutor.rating.toFixed(1)}</Text>
                  </View>
                )}
                {course.experienceYears != null && (
                  <Text className="text-text-muted text-sm">
                    {course.experienceYears} año{course.experienceYears !== 1 ? 's' : ''} exp.
                  </Text>
                )}
                {course.tutor.disponible && (
                  <View className="bg-green-100 px-2 py-0.5 rounded-full">
                    <Text className="text-green-700 text-xs font-semibold">Disponible</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {course.tutor.bio ? (
            <Text className="text-text-muted text-sm leading-6">{course.tutor.bio}</Text>
          ) : null}
        </View>

        {/* Datos de contacto */}
        <SectionCard>
          {course.tutor.city ? (
            <InfoRow icon="location-outline" label="Ciudad" value={course.tutor.city} />
          ) : null}
          {course.tutor.email ? (
            <InfoRow icon="mail-outline" label="Correo" value={course.tutor.email} />
          ) : null}
          {course.tutor.certificaciones.length > 0 ? (
            <InfoRow
              icon="ribbon-outline"
              label="Certificaciones"
              value={`${course.tutor.certificaciones.length} certificado${course.tutor.certificaciones.length > 1 ? 's' : ''} verificado${course.tutor.certificaciones.length > 1 ? 's' : ''}`}
            />
          ) : null}
        </SectionCard>

        {/* Otras materias */}
        {course.tutor.subjects && course.tutor.subjects.length > 0 && (
          <View className="mx-6 mb-4">
            <Text className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2">
              También enseña
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {course.tutor.subjects.map((s) => (
                <View key={s} className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                  <Text className="text-primary text-xs font-medium">{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certificaciones detalle */}
        {course.tutor.certificaciones.length > 0 && (
          <SectionCard>
            <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
              <Ionicons name="ribbon-outline" size={16} color="#006A75" />
              <Text className="text-text-primary font-semibold text-sm">Certificaciones</Text>
            </View>
            {course.tutor.certificaciones.map((cert) => (
              <View key={cert.id} className="flex-row items-center gap-3 px-4 py-3 border-t border-border">
                <Ionicons
                  name={cert.mimeType === 'application/pdf' ? 'document-text-outline' : 'image-outline'}
                  size={16} color="#64748B"
                />
                <Text className="text-text-muted text-sm flex-1" numberOfLines={1}>
                  {cert.nombreArchivo}
                </Text>
              </View>
            ))}
          </SectionCard>
        )}

      </ScrollView>

      {/* CTA fijo */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-background border-t border-border gap-3">
        <TouchableOpacity
          activeOpacity={0.85}
          className="bg-primary rounded-full py-4 items-center"
          onPress={() => router.push(`/(learner)/booking/${courseId}` as any)}
        >
          <Text className="text-white font-semibold text-base">
            Reservar sesión — ${course.price.toLocaleString('es-CO')} COP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={chatLoading || !course.tutor?.clerkId}
          onPress={handleConsultar}
          className="flex-row items-center justify-center gap-2 border border-primary rounded-full py-3"
        >
          {chatLoading
            ? <ActivityIndicator color="#006A75" size="small" />
            : <>
                <Ionicons name="chatbubble-outline" size={16} color="#006A75" />
                <Text className="text-primary font-semibold text-sm">Consultar al tutor</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
