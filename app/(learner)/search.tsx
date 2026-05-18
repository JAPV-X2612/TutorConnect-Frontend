import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIcon } from '@/constants/category-icons';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { useRouter } from 'expo-router';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import { COURSE_CATEGORIES } from '@/constants/registration-options';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourseResult {
  id: string;
  subject: string;
  description?: string;
  price: number;
  duration: number;
  modalidad: string;
  academicLevel?: string;
  score: number;
  tutor: {
    id: string;
    nombre: string;
    apellido: string;
    rating?: number;
    disponible: boolean;
  };
}

interface LegacyTutor {
  id: string;
  nombre: string;
  apellido: string;
  subjects?: string[];
  rating?: number;
  disponible: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#006A75', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── CourseCard ────────────────────────────────────────────────────────────────

/**
 * Displays a single course search result or recommendation card.
 * Navigates to the course detail screen on press.
 *
 * @author TutorConnect Team
 */
function CourseCard({ course }: { course: CourseResult }) {
  const router = useRouter();
  const color = avatarColor(course.tutor.nombre);
  const initial = course.tutor.nombre.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(learner)/course/${course.id}` as any)}
      activeOpacity={0.8}
      accessibilityLabel={`Ver curso ${course.subject}`}
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        marginBottom: 10,
      }}
    >
      {/* Course name */}
      <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 15, marginBottom: 6 }}
        numberOfLines={2}>
        {course.subject}
      </Text>

      {/* Tutor row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <View style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: color, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{initial}</Text>
        </View>
        <Text style={{ color: '#64748B', fontSize: 12, flex: 1 }} numberOfLines={1}>
          {course.tutor.nombre} {course.tutor.apellido}
        </Text>
        {course.tutor.rating != null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Text style={{ color: '#F59E0B', fontSize: 11 }}>★</Text>
            <Text style={{ color: '#64748B', fontSize: 11 }}>{course.tutor.rating.toFixed(1)}</Text>
          </View>
        )}
        {course.tutor.disponible && (
          <View style={{ backgroundColor: '#DCFCE7', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 }}>
            <Text style={{ color: '#166534', fontSize: 9, fontWeight: '700' }}>DISPONIBLE</Text>
          </View>
        )}
      </View>

      {/* Chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {[
          `$${course.price.toLocaleString('es-CO')} COP`,
          `${course.duration} min`,
          course.modalidad,
          ...(course.academicLevel ? [course.academicLevel] : []),
        ].map((chip) => (
          <View key={chip} style={{
            backgroundColor: '#F0FDFA', borderRadius: 99,
            paddingHorizontal: 8, paddingVertical: 3,
            borderWidth: 1, borderColor: '#99F6E4',
          }}>
            <Text style={{ color: '#0D9488', fontSize: 11, fontWeight: '600' }}>{chip}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ── LegacyTutorCard ───────────────────────────────────────────────────────────

function LegacyTutorCard({ tutor }: { tutor: LegacyTutor }) {
  const color = avatarColor(tutor.nombre);
  const initials = `${tutor.nombre.charAt(0)}${tutor.apellido.charAt(0)}`.toUpperCase();
  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 16,
      borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 46, height: 46, borderRadius: 23,
          backgroundColor: color, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 15 }}>
              {tutor.nombre} {tutor.apellido}
            </Text>
            {tutor.disponible && (
              <View style={{ backgroundColor: '#DCFCE7', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ color: '#166534', fontSize: 9, fontWeight: '700' }}>DISPONIBLE</Text>
              </View>
            )}
          </View>
          <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {tutor.subjects?.join(' · ') ?? 'Sin materias'}
          </Text>
        </View>
      </View>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 12,
        paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: '#F59E0B' }}>★</Text>
          <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '500' }}>
            {tutor.rating != null ? tutor.rating.toFixed(1) : 'Nuevo'}
          </Text>
        </View>
        <Text style={{ color: '#006A75', fontWeight: '700', fontSize: 14 }}>
          Ver cursos
        </Text>
      </View>
    </View>
  );
}

// ── SearchScreen ──────────────────────────────────────────────────────────────

/**
 * Learner search screen.
 *
 * Provides two discovery modes:
 * 1. Semantic search — natural-language query against course embeddings.
 * 2. Personalized recommendations — pre-loaded from the learner's profile.
 *
 * Falls back to category → subject → tutor browsing when no query is active.
 *
 * @author TutorConnect Team
 */
export default function SearchScreen() {
  const { user } = useUser();
  const api = useApiRequest();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CourseResult[]>([]);
  const [recommendations, setRecommendations] = useState<CourseResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recoLoading, setRecoLoading] = useState(true);
  const [legacyTutors, setLegacyTutors] = useState<LegacyTutor[]>([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const activeCategory = COURSE_CATEGORIES.find((c) => c.id === selectedCategory);

  // Reload recommendations every time the screen focuses
  useFocusEffect(useCallback(() => {
    setRecoLoading(true);
    api.get<CourseResult[]>(API_ENDPOINTS.searchRecommendations(10)).then((res) => {
      if (Array.isArray(res.data)) setRecommendations(res.data);
      setRecoLoading(false);
    });
  }, []));

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearchLoading(true);
    const res = await api.get<CourseResult[]>(API_ENDPOINTS.searchCourses(q, 10));
    if (Array.isArray(res.data)) setSearchResults(res.data);
    setSearchLoading(false);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
  };

  const fetchLegacyTutors = useCallback(async (subject: string) => {
    setLegacyLoading(true);
    const res = await api.get<LegacyTutor[]>(API_ENDPOINTS.tutors(subject));
    setLegacyTutors(res.data ?? []);
    setLegacyLoading(false);
  }, []);

  useEffect(() => {
    if (selectedSubject) fetchLegacyTutors(selectedSubject);
  }, [selectedSubject, fetchLegacyTutors]);

  // ── Subject list ───────────────────────────────────────────────────────────

  if (selectedCategory && !selectedSubject) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 8,
          borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
          backgroundColor: '#fff', gap: 8,
        }}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)} accessibilityLabel="Volver" style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1 }} numberOfLines={1}>
            {activeCategory?.label}
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
          {activeCategory?.subjects.map((subject) => (
            <TouchableOpacity
              key={subject}
              onPress={() => setSelectedSubject(subject)}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
                borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: '#0F172A', fontWeight: '500', fontSize: 15 }}>{subject}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Tutor results (legacy browse) ──────────────────────────────────────────

  if (selectedCategory && selectedSubject) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 8,
          borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
          backgroundColor: '#fff', gap: 8,
        }}>
          <TouchableOpacity onPress={() => setSelectedSubject(null)} accessibilityLabel="Volver" style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1 }} numberOfLines={1}>
            {selectedSubject}
          </Text>
        </View>

        {legacyLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#006A75" />
          </View>
        ) : (
          <FlatList
            data={legacyTutors}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
            renderItem={({ item }) => <LegacyTutorCard tutor={item} />}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                {activeCategory && <CategoryIcon id={activeCategory.id} size={44} color="#CBD5E1" />}
                <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 17, marginTop: 12 }}>
                  Sin tutores aún
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                  Nadie ofrece {selectedSubject} todavía.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Main screen ────────────────────────────────────────────────────────────

  const showResults = query.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, backgroundColor: '#F8FAFC' }}>
        <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 24, marginBottom: 4 }}>
          Hola, {user?.firstName ?? 'allí'}
        </Text>
        <Text style={{ color: '#64748B', fontSize: 13, lineHeight: 19 }}>
          Desde cálculo hasta cocina francesa — encuentra el tutor perfecto.
        </Text>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#fff', borderRadius: 14,
          borderWidth: 1, borderColor: '#E2E8F0',
          paddingHorizontal: 14, gap: 10,
          shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
        }}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            ref={inputRef}
            style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: '#0F172A' }}
            placeholder="¿Qué quieres aprender? Ej: cálculo integral..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} accessibilityLabel="Limpiar búsqueda">
              <Ionicons name="close-circle" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Search results ── */}
      {showResults ? (
        <FlatList
          data={searchResults}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 }}
          renderItem={({ item }) => <CourseCard course={item} />}
          ListHeaderComponent={
            searchLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator color="#006A75" />
                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 10 }}>
                  Buscando cursos...
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !searchLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                <Ionicons name="search-outline" size={44} color="#CBD5E1" />
                <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 17, marginTop: 16 }}>
                  Sin resultados
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                  Intenta con otro término o explora por categoría.
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        // ── Browse mode ──
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Recommendations section */}
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name="sparkles" size={16} color="#006A75" />
              <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 15 }}>
                Para ti
              </Text>
            </View>

            {recoLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator color="#006A75" />
              </View>
            ) : recommendations.length > 0 ? (
              recommendations.slice(0, 5).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))
            ) : (
              <View style={{
                backgroundColor: '#fff', borderRadius: 16,
                borderWidth: 1, borderColor: '#E2E8F0',
                paddingHorizontal: 20, paddingVertical: 18,
                alignItems: 'center',
              }}>
                <Ionicons name="person-circle-outline" size={32} color="#CBD5E1" />
                <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
                  Completa tu perfil para recibir{'\n'}recomendaciones personalizadas.
                </Text>
              </View>
            )}
          </View>

          {/* Category grid */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 15, marginBottom: 12 }}>
              Explorar por categoría
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {COURSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                  accessibilityLabel={cat.label}
                  style={{
                    width: '47%', backgroundColor: '#fff',
                    borderWidth: 1, borderColor: '#E2E8F0',
                    borderRadius: 18, padding: 16, alignItems: 'center', gap: 8,
                  }}
                >
                  <CategoryIcon id={cat.id} size={30} color="#006A75" />
                  <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 13, textAlign: 'center' }}>
                    {cat.label}
                  </Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'center' }} numberOfLines={1}>
                    {cat.subjects.slice(0, 2).join(', ')}...
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
