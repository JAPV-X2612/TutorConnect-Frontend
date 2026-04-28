import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, ScrollView, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import { COURSE_CATEGORIES } from '@/constants/registration-options';

const AVATAR_COLORS = ['#006A75', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface CourseListing {
  id: string;
  subject: string;
  description?: string;
  price: number;
  duration: number;
  modalidad: string;
  schedule: { day: string; startTime: string; endTime: string }[];
  tutor: { id: string; nombre: string; apellido: string; rating?: number; disponible: boolean };
}

function CourseCard({ course, onPress }: { course: CourseListing; onPress: () => void }) {
  const initials = `${course.tutor.nombre.charAt(0)}${course.tutor.apellido.charAt(0)}`.toUpperCase();
  const color = avatarColor(course.tutor.nombre);
  const dayCount = course.schedule?.length ?? 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      className="bg-white rounded-2xl border border-border mb-3 overflow-hidden">
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-text-primary font-bold text-base flex-1 mr-2" numberOfLines={2}>
            {course.subject}
          </Text>
          <View className="bg-primary/10 px-2.5 py-1 rounded-full">
            <Text className="text-primary text-xs font-bold">
              ${course.price.toLocaleString('es-CO')}
            </Text>
          </View>
        </View>

        {course.description ? (
          <Text className="text-text-muted text-sm leading-5 mb-3" numberOfLines={2}>
            {course.description}
          </Text>
        ) : null}

        <View className="flex-row items-center gap-3 mb-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text className="text-text-muted text-xs">{course.duration} min</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="laptop-outline" size={13} color="#64748B" />
            <Text className="text-text-muted text-xs">{course.modalidad}</Text>
          </View>
          {dayCount > 0 && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={13} color="#64748B" />
              <Text className="text-text-muted text-xs">{dayCount} día{dayCount > 1 ? 's' : ''}/sem</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center border-t border-border pt-3 gap-2">
          <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: color }}>
            <Text className="text-white text-xs font-bold">{initials}</Text>
          </View>
          <Text className="text-text-primary text-sm font-medium flex-1">
            {course.tutor.nombre} {course.tutor.apellido}
          </Text>
          {course.tutor.rating != null && (
            <View className="flex-row items-center gap-1">
              <Text className="text-yellow-500 text-xs">★</Text>
              <Text className="text-text-muted text-xs">{course.tutor.rating.toFixed(1)}</Text>
            </View>
          )}
          {course.tutor.disponible && (
            <View className="bg-green-100 px-2 py-0.5 rounded-full">
              <Text className="text-green-700 text-xs font-semibold">Disponible</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function LearnerMarketplaceScreen() {
  const api = useApiRequest();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.get<CourseListing[]>(API_ENDPOINTS.courseListings());
    if (result.error) setError('No se pudieron cargar los cursos.');
    else setCourses(result.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filtered = courses.filter((c) => {
    const matchesSearch = search.trim()
      ? c.subject.toLowerCase().includes(search.toLowerCase()) ||
        `${c.tutor.nombre} ${c.tutor.apellido}`.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesCategory = activeCategory
      ? COURSE_CATEGORIES.find((cat) => cat.id === activeCategory)
          ?.subjects.some((s) => c.subject.toLowerCase().includes(s.toLowerCase()))
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-5 pb-3">
        <Text className="text-2xl font-bold text-text-primary mb-1">Explorar cursos</Text>
        <Text className="text-text-muted text-sm">
          Desde cálculo multivariado hasta cocina francesa
        </Text>
      </View>

      <View className="px-6 mb-3">
        <View className="flex-row items-center bg-white border border-border rounded-xl px-3 gap-2">
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            className="flex-1 py-3 text-base text-text-primary"
            placeholder="Buscar curso o tutor..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingBottom: 4 }}
        className="mb-3" style={{ maxHeight: 44 }}>
        <TouchableOpacity onPress={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full border ${!activeCategory ? 'bg-primary border-primary' : 'bg-white border-border'}`}>
          <Text className={`text-xs font-semibold ${!activeCategory ? 'text-white' : 'text-text-muted'}`}>Todos</Text>
        </TouchableOpacity>
        {COURSE_CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.id}
            onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${activeCategory === cat.id ? 'bg-primary border-primary' : 'bg-white border-border'}`}>
            <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
            <Text className={`text-xs font-semibold ${activeCategory === cat.id ? 'text-white' : 'text-text-muted'}`}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#006A75" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={fetchCourses} className="bg-primary rounded-full px-6 py-3">
            <Text className="text-white font-semibold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
          renderItem={({ item }) => (
            <CourseCard course={item}
              onPress={() => router.push({
                pathname: '/(learner)/course/[courseId]',
                params: { courseId: item.id },
              } as any)}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text className="text-text-primary font-semibold text-lg mt-4">Sin resultados</Text>
              <Text className="text-text-muted text-sm text-center mt-2 leading-5">
                {search ? `No hay cursos para "${search}"` : 'Aún no hay cursos publicados.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
