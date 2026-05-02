import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator, FlatList, ScrollView, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import { COURSE_CATEGORIES } from '@/constants/registration-options';
import { CategoryIcon } from '@/constants/category-icons';

const AVATAR_COLORS = ['#006A75', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface Course {
  id: string;
  subject: string;
  description?: string;
  price: number;
  duration: number;
  modalidad: string;
  academicLevel?: string;
  schedule?: { day: string; startTime: string; endTime: string }[];
  score?: number;
  tutor: { id: string; nombre: string; apellido: string; rating?: number; disponible: boolean };
}

function CourseCard({ course, onPress }: { course: Course; onPress: () => void }) {
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

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [searchResults, setSearchResults] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoLoading, setRecoLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // General course listing
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.get<Course[]>(API_ENDPOINTS.courseListings());
    if (result.error) setError('No se pudieron cargar los cursos.');
    else setAllCourses(result.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // Personalized recommendations
  const apiRef = useRef(api);
  apiRef.current = api;

  useEffect(() => {
    setRecoLoading(true);
    apiRef.current.get<Course[]>(API_ENDPOINTS.searchRecommendations(5)).then((res) => {
      if (Array.isArray(res.data)) setRecommendations(res.data);
      setRecoLoading(false);
    });
  }, []);

  // Semantic search on submit
  const handleSearch = async () => {
    const q = search.trim();
    if (!q) { setSearchResults(null); return; }
    setSearchLoading(true);
    const res = await api.get<Course[]>(API_ENDPOINTS.searchCourses(q, 10));
    setSearchResults(Array.isArray(res.data) ? res.data : []);
    setSearchLoading(false);
  };

  const navigateToCourse = (courseId: string) =>
    router.push({ pathname: '/(learner)/course/[courseId]', params: { courseId } } as any);

  // Filtered general listing (local filter by category only)
  const filtered = allCourses.filter((c) => {
    const matchesCategory = activeCategory
      ? COURSE_CATEGORIES.find((cat) => cat.id === activeCategory)
          ?.subjects.some((s) => c.subject.toLowerCase().includes(s.toLowerCase()))
      : true;
    return matchesCategory;
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-5 pb-3">
        <Text className="text-2xl font-bold text-text-primary mb-1">Explorar cursos</Text>
      </View>

      {/* Search bar */}
      <View className="px-6 mb-3">
        <View className="flex-row items-center bg-white border border-border rounded-xl px-3 gap-2">
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            className="flex-1 py-3 text-base text-text-primary"
            placeholder="Buscar con IA..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={(t) => { setSearch(t); if (!t.trim()) setSearchResults(null); }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setSearchResults(null); }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
          {searchLoading && <ActivityIndicator size="small" color="#006A75" />}
        </View>
      </View>

      {/* Semantic search results */}
      {searchResults !== null ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
          ListHeaderComponent={
            <Text style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{search}"
            </Text>
          }
          renderItem={({ item }) => <CourseCard course={item} onPress={() => navigateToCourse(item.id)} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text className="text-text-primary font-semibold text-lg mt-4">Sin resultados</Text>
              <Text className="text-text-muted text-sm text-center mt-2">
                Intenta con otras palabras
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          ListHeaderComponent={
            <>
              {/* Para ti */}
              <View style={{ paddingHorizontal: 24, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Ionicons name="sparkles" size={15} color="#006A75" />
                  <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 15 }}>Para ti</Text>
                </View>

                {recoLoading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <ActivityIndicator color="#006A75" />
                  </View>
                ) : recommendations.length > 0 ? (
                  recommendations.map((course) => (
                    <CourseCard key={course.id} course={course} onPress={() => navigateToCourse(course.id)} />
                  ))
                ) : (
                  <View style={{
                    backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1,
                    borderColor: '#E2E8F0', padding: 16, marginBottom: 12,
                  }}>
                    <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
                      Completa tu perfil para ver recomendaciones personalizadas
                    </Text>
                  </View>
                )}
              </View>

              {/* Category filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingBottom: 4 }}
                style={{ maxHeight: 44, marginBottom: 12 }}>
                <TouchableOpacity onPress={() => setActiveCategory(null)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1,
                    backgroundColor: !activeCategory ? '#006A75' : '#fff',
                    borderColor: !activeCategory ? '#006A75' : '#E2E8F0',
                  }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: !activeCategory ? '#fff' : '#64748B' }}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {COURSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat.id}
                    onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1,
                      backgroundColor: activeCategory === cat.id ? '#006A75' : '#fff',
                      borderColor: activeCategory === cat.id ? '#006A75' : '#E2E8F0',
                    }}>
                    <CategoryIcon id={cat.id} size={12} color={activeCategory === cat.id ? '#fff' : '#006A75'} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: activeCategory === cat.id ? '#fff' : '#64748B' }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={{ paddingHorizontal: 24, color: '#0F172A', fontWeight: '700', fontSize: 15, marginBottom: 12 }}>
                Todos los cursos
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 24 }}>
              <CourseCard course={item} onPress={() => navigateToCourse(item.id)} />
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Ionicons name="book-outline" size={48} color="#CBD5E1" />
                <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 18, marginTop: 16 }}>
                  Sin cursos
                </Text>
                <Text style={{ color: '#64748B', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                  {activeCategory ? 'No hay cursos en esta categoría.' : 'Aún no hay cursos publicados.'}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
