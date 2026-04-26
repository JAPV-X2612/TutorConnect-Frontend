import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useApiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { useProfile } from '@/hooks/use-profile';
import { useTutorCourses } from '@/hooks/use-tutor-courses';
import { COURSE_CATEGORIES } from '@/constants/registration-options';

// ── Shared types ─────────────────────────────────────────────────────────────

interface Tutor {
  id: string;
  nombre: string;
  apellido: string;
  subjects?: string[];
  rating?: number;
  precioHora?: number;
  disponible: boolean;
}

// ── Learner marketplace ───────────────────────────────────────────────────────

const AVATAR_COLORS = ['#006A75', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  const avatarColor = getAvatarColor(tutor.nombre);
  const initials = `${tutor.nombre.charAt(0)}${tutor.apellido.charAt(0)}`.toUpperCase();
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-border">
      <View className="flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: avatarColor }}>
          <Text className="text-white font-bold text-base">{initials}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-text-primary font-semibold text-base">{tutor.nombre} {tutor.apellido}</Text>
            {tutor.disponible && (
              <View className="bg-green-100 px-2 py-0.5 rounded-full">
                <Text className="text-green-700 text-xs font-semibold">DISPONIBLE</Text>
              </View>
            )}
          </View>
          <Text className="text-text-muted text-sm mt-0.5" numberOfLines={1}>
            {tutor.subjects?.join(' · ') ?? 'Sin materias'}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
        <View className="flex-row items-center gap-1">
          <Text className="text-yellow-500 text-sm">★</Text>
          <Text className="text-text-primary text-sm font-medium">
            {tutor.rating != null ? tutor.rating.toFixed(1) : 'Nuevo'}
          </Text>
        </View>
        <Text className="text-primary font-bold text-base">
          {tutor.precioHora != null && tutor.precioHora > 0
            ? `$${tutor.precioHora.toLocaleString('es-CO')}/sesión`
            : 'Precio a consultar'}
        </Text>
      </View>
    </View>
  );
}

function LearnerHomeScreen() {
  const { user } = useUser();
  const api = useApiRequest();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const activeCategory = COURSE_CATEGORIES.find((c) => c.id === selectedCategory);

  const fetchTutors = async (subject: string) => {
    setLoading(true);
    setError(null);
    const result = await api.get<Tutor[]>(API_ENDPOINTS.tutors(subject));
    if (result.error) setError('No se pudieron cargar los tutores.');
    else setTutors(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedSubject) fetchTutors(selectedSubject);
  }, [selectedSubject]);

  const filteredTutors = search.trim()
    ? tutors.filter((t) => `${t.nombre} ${t.apellido}`.toLowerCase().includes(search.toLowerCase()))
    : tutors;

  const firstName = user?.firstName ?? 'allí';

  // ── Category grid ───────────────────────────────────────────────────────────
  if (!selectedCategory) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-6 pt-6 pb-4">
            <Text className="text-2xl font-bold text-text-primary">
              Hola, {firstName} 👋
            </Text>
            <Text className="text-text-muted text-sm mt-1 leading-5">
              Desde cálculo multivariado hasta cocina francesa — encuentra el tutor perfecto para lo que quieras aprender.
            </Text>
          </View>

          <View className="px-6 mb-5">
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-base text-text-primary"
              placeholder="¿Qué quieres aprender hoy?"
              placeholderTextColor="#64748B"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View className="px-6">
            <Text className="text-base font-semibold text-text-primary mb-3">Explorar por categoría</Text>
            <View className="flex-row flex-wrap gap-3">
              {COURSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                  className="bg-white border border-border rounded-2xl p-4 items-center gap-2"
                  style={{ width: '47%' }}
                >
                  <Text style={{ fontSize: 28 }}>{cat.emoji}</Text>
                  <Text className="text-text-primary font-semibold text-sm text-center">{cat.label}</Text>
                  <Text className="text-text-muted text-xs text-center" numberOfLines={1}>
                    {cat.subjects.slice(0, 2).join(', ')}...
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Subject list ────────────────────────────────────────────────────────────
  if (!selectedSubject) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-text-primary">
            {activeCategory?.emoji} {activeCategory?.label}
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
          {activeCategory?.subjects.map((subject) => (
            <TouchableOpacity key={subject} onPress={() => setSelectedSubject(subject)} activeOpacity={0.8}
              className="bg-white border border-border rounded-2xl px-5 py-4 flex-row items-center justify-between">
              <Text className="text-text-primary font-medium text-base">{subject}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Tutor results ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
        <TouchableOpacity onPress={() => setSelectedSubject(null)}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-semibold text-text-primary">{selectedSubject}</Text>
          <Text className="text-xs text-text-muted">{activeCategory?.emoji} {activeCategory?.label}</Text>
        </View>
      </View>

      <View className="px-5 py-3">
        <TextInput
          className="bg-white border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
          placeholder="Filtrar por nombre..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#006A75" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 text-center text-base mb-4">{error}</Text>
          <TouchableOpacity onPress={() => fetchTutors(selectedSubject)} className="bg-primary rounded-full px-6 py-3">
            <Text className="text-white font-semibold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTutors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          renderItem={({ item }) => <TutorCard tutor={item} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-16">
              <Text style={{ fontSize: 40 }}>{activeCategory?.emoji}</Text>
              <Text className="text-text-primary font-semibold text-lg mt-3">Sin tutores aún</Text>
              <Text className="text-text-muted text-sm text-center mt-2 leading-5 px-6">
                Nadie ofrece {selectedSubject} todavía.{'\n'}¡Sé el primero en enseñarlo!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Tutor dashboard ───────────────────────────────────────────────────────────

interface TutorService {
  subject: string;
  price: number;
  duration: number;
}

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

function ServiceCard({ service, onEdit }: { service: TutorService; onEdit: () => void }) {
  return (
    <View className="bg-white border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-base">{service.subject}</Text>
          <View className="flex-row gap-3 mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="cash-outline" size={13} color="#64748B" />
              <Text className="text-text-muted text-xs">${service.price.toLocaleString('es-CO')} COP</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text className="text-text-muted text-xs">{service.duration} min</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onEdit} activeOpacity={0.7}
          className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
          <Ionicons name="pencil-outline" size={15} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TutorHomeScreen() {
  const { user } = useUser();
  const { profile, loading } = useProfile();
  const { courses, loading: coursesLoading, refetch } = useTutorCourses();
  const router = useRouter();
  const isActive = profile?.status === 'ACTIVE';

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
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
        <View className="px-6 pt-6 pb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-text-primary">
              Hola, {user?.firstName ?? 'Tutor'}
            </Text>
            <Text className="text-text-muted text-sm mt-0.5">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full ${isActive ? 'bg-green-100' : 'bg-amber-100'}`}>
            <Text className={`text-xs font-semibold ${isActive ? 'text-green-700' : 'text-amber-700'}`}>
              {isActive ? 'Activo' : 'En revisión'}
            </Text>
          </View>
        </View>

        <EarningsCard />

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
          <TouchableOpacity onPress={() => router.push('/(tabs)/sesiones' as any)} activeOpacity={0.8}
            className="flex-row items-center gap-1">
            <Text className="text-primary text-sm font-semibold">Ver</Text>
            <Ionicons name="chevron-forward" size={16} color="#006A75" />
          </TouchableOpacity>
        </View>

        <View className="px-6 mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text-primary font-semibold text-base">Mis cursos</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/crear-curso' as any)}
              activeOpacity={0.8} className="flex-row items-center gap-1">
              <Ionicons name="add-circle-outline" size={18} color="#006A75" />
              <Text className="text-primary text-sm font-semibold">Agregar</Text>
            </TouchableOpacity>
          </View>

          {coursesLoading ? (
            <ActivityIndicator color="#006A75" style={{ marginVertical: 16 }} />
          ) : courses.length > 0 ? (
            courses.filter((c) => c.isActive).map((c) => (
              <ServiceCard
                key={c.id}
                service={{ subject: c.subject, price: c.price, duration: c.duration }}
                onEdit={() => router.push({
                  pathname: '/(tabs)/crear-curso',
                  params: {
                    courseId: c.id,
                    subject: c.subject,
                    price: String(c.price),
                    duration: String(c.duration),
                    modalidad: c.modalidad,
                    level: c.academicLevel ?? '',
                    description: c.description ?? '',
                  },
                } as any)}
              />
            ))
          ) : (
            <View className="bg-white border border-dashed border-border rounded-2xl p-6 items-center">
              <Ionicons name="book-outline" size={32} color="#CBD5E1" />
              <Text className="text-text-muted text-sm text-center mt-2 leading-5">
                Aún no has agregado cursos.{'\n'}Crea tu primera oferta.
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/crear-curso' as any)}
                activeOpacity={0.85} className="mt-4 bg-primary rounded-full px-5 py-2.5">
                <Text className="text-white text-sm font-semibold">Crear curso</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Role dispatcher ───────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#006A75" />
      </SafeAreaView>
    );
  }

  const role = user?.publicMetadata?.role as string | undefined;
  return role === 'tutor' ? <TutorHomeScreen /> : <LearnerHomeScreen />;
}
