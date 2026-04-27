import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
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
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import { COURSE_CATEGORIES } from '@/constants/registration-options';

interface Tutor {
  id: string;
  nombre: string;
  apellido: string;
  subjects?: string[];
  rating?: number;
  precioHora?: number;
  disponible: boolean;
}

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

/**
 * Learner search screen — category grid → subject list → tutor results.
 *
 * @author TutorConnect Team
 */
export default function SearchScreen() {
  const { user } = useUser();
  const api = useApiRequest();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const activeCategory = COURSE_CATEGORIES.find((c) => c.id === selectedCategory);

  const fetchTutors = useCallback(async (subject: string) => {
    setLoading(true);
    setError(null);
    const result = await api.get<Tutor[]>(API_ENDPOINTS.tutors(subject));
    if (result.error) setError('No se pudieron cargar los tutores.');
    else setTutors(result.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedSubject) fetchTutors(selectedSubject);
  }, [selectedSubject, fetchTutors]);

  const filteredTutors = search.trim()
    ? tutors.filter((t) => `${t.nombre} ${t.apellido}`.toLowerCase().includes(search.toLowerCase()))
    : tutors;

  const firstName = user?.firstName ?? 'allí';

  // Category grid
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

  // Subject list
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

  // Tutor results
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
