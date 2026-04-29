import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useProfile } from '@/hooks/use-profile';
import { useTutorCourses } from '@/hooks/use-tutor-courses';

// ── Sub-components ────────────────────────────────────────────────────────────

function EarningsCard() {
  return (
    <View className="mx-6 mb-5 bg-primary rounded-2xl p-5">
      <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">
        Ganancias este mes
      </Text>
      <Text className="text-white text-3xl font-bold mb-4">$0</Text>
      <View className="flex-row gap-4 pt-4 border-t border-white/20">
        <View className="flex-1">
          <Text className="text-white/60 text-xs mb-0.5">Total acumulado</Text>
          <Text className="text-white font-semibold text-sm">$0</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white/60 text-xs mb-0.5">Sesiones este mes</Text>
          <Text className="text-white font-semibold text-sm">0</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white/60 text-xs mb-0.5">Por cobrar</Text>
          <Text className="text-white font-semibold text-sm">$0</Text>
        </View>
      </View>
    </View>
  );
}

interface CourseCardProps {
  subject: string;
  price: number;
  duration: number;
  onEdit: () => void;
}

function CourseCard({ subject, price, duration, onEdit }: CourseCardProps) {
  return (
    <View className="bg-white border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-base">{subject}</Text>
          <View className="flex-row gap-3 mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="cash-outline" size={13} color="#64748B" />
              <Text className="text-text-muted text-xs">${price.toLocaleString('es-CO')} COP</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text className="text-text-muted text-xs">{duration} min</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={onEdit}
          activeOpacity={0.7}
          className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center"
        >
          <Ionicons name="pencil-outline" size={15} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TutorDashboardScreen() {
  const { user } = useUser();
  const { profile, loading } = useProfile();
  const { courses, loading: coursesLoading, refetch } = useTutorCourses();
  const router = useRouter();
  const isActive = profile?.status === 'ACTIVE';

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#006A75" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-text-primary">
              Hola, {user?.firstName ?? 'Tutor'}
            </Text>
            <Text className="text-text-muted text-sm mt-0.5">
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full ${isActive ? 'bg-green-100' : 'bg-amber-100'}`}>
            <Text className={`text-xs font-semibold ${isActive ? 'text-green-700' : 'text-amber-700'}`}>
              {isActive ? 'Activo' : 'En revisión'}
            </Text>
          </View>
        </View>

        <EarningsCard />

        {/* Pending sessions shortcut */}
        <View className="mx-6 mb-5 bg-white border border-border rounded-2xl p-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
              <Ionicons name="notifications-outline" size={20} color="#d97706" />
            </View>
            <View>
              <Text className="text-text-primary font-semibold text-sm">Solicitudes pendientes</Text>
              <Text className="text-text-muted text-xs mt-0.5">0 esperando respuesta</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tutor)/sessions' as any)}
            activeOpacity={0.8}
            className="flex-row items-center gap-1"
          >
            <Text className="text-primary text-sm font-semibold">Ver</Text>
            <Ionicons name="chevron-forward" size={16} color="#006A75" />
          </TouchableOpacity>
        </View>

        {/* Courses section */}
        <View className="px-6 mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text-primary font-semibold text-base">Mis cursos</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tutor)/crear-curso' as any)}
              activeOpacity={0.8}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="add-circle-outline" size={18} color="#006A75" />
              <Text className="text-primary text-sm font-semibold">Agregar</Text>
            </TouchableOpacity>
          </View>

          {coursesLoading ? (
            <ActivityIndicator color="#006A75" style={{ marginVertical: 16 }} />
          ) : courses.filter((c) => c.isActive).length > 0 ? (
            courses
              .filter((c) => c.isActive)
              .map((c) => (
                <CourseCard
                  key={c.id}
                  subject={c.subject}
                  price={c.price}
                  duration={c.duration}
                  onEdit={() =>
                    router.push({
                      pathname: '/(tutor)/crear-curso',
                      params: {
                        courseId: c.id,
                        subject: c.subject,
                        price: String(c.price),
                        duration: String(c.duration),
                        modalidad: c.modalidad,
                        level: c.academicLevel ?? '',
                        description: c.description ?? '',
                        schedule: JSON.stringify(c.schedule ?? []),
                      },
                    } as any)
                  }
                />
              ))
          ) : (
            <View className="bg-white border border-dashed border-border rounded-2xl p-6 items-center">
              <Ionicons name="book-outline" size={32} color="#CBD5E1" />
              <Text className="text-text-muted text-sm text-center mt-2 leading-5">
                Aún no has agregado cursos.{'\n'}Crea tu primera oferta.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tutor)/crear-curso' as any)}
                activeOpacity={0.85}
                className="mt-4 bg-primary rounded-full px-5 py-2.5"
              >
                <Text className="text-white text-sm font-semibold">Crear curso</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
