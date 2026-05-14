import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectInput } from '@/components/ui/select-input';
import { COURSE_CATEGORIES, MODALIDADES, ACADEMIC_LEVELS } from '@/constants/registration-options';
import { CategoryIcon } from '@/constants/category-icons';
import { useTutorCourses, type ScheduleSlot } from '@/hooks/use-tutor-courses';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

// ── Constants ─────────────────────────────────────────────────────────────────

type Duration = 30 | 60 | 90;
type Day = ScheduleSlot['day'];

const DAYS: { key: Day; label: string }[] = [
  { key: 'MONDAY', label: 'Lun' },
  { key: 'TUESDAY', label: 'Mar' },
  { key: 'WEDNESDAY', label: 'Mié' },
  { key: 'THURSDAY', label: 'Jue' },
  { key: 'FRIDAY', label: 'Vie' },
  { key: 'SATURDAY', label: 'Sáb' },
  { key: 'SUNDAY', label: 'Dom' },
];

const TOTAL_STEPS = 4;

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle = {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 14,
  color: '#0F172A',
} as const;

const inputErrorStyle = { ...inputStyle, borderColor: '#F87171' } as const;

function Label({ text, optional, error }: { text: string; optional?: boolean; error?: boolean }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: error ? '#F87171' : '#64748B',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
    }}>
      {text}
      {optional && (
        <Text style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>
          {' '}(opcional)
        </Text>
      )}
    </Text>
  );
}

// ── TutorPrimerCursoScreen ────────────────────────────────────────────────────

/**
 * Optional step 4 of tutor registration: create the first course.
 * Without at least one course the tutor is invisible in semantic search.
 *
 * @author TutorConnect Team
 */
export default function TutorPrimerCursoScreen() {
  const router = useRouter();
  const { create } = useTutorCourses();
  const { get } = useApiRequest();

  // Subject accordion
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Course fields
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState<Duration>(60);
  const [modalidad, setModalidad] = useState('');
  const [level, setLevel] = useState('');
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Validation ───────────────────────────────────────────────────────────────

  const canPublish =
    !!selectedSubject &&
    description.trim().length >= 20 &&
    !!price && Number(price) > 0 &&
    !!modalidad &&
    schedule.length > 0;

  const errors = {
    subject: submitted && !selectedSubject,
    description: submitted && description.trim().length < 20,
    price: submitted && (!price || Number(price) <= 0),
    modalidad: submitted && !modalidad,
    schedule: submitted && schedule.length === 0,
  };

  // ── Schedule helpers ──────────────────────────────────────────────────────────

  const toggleDay = (day: Day) => {
    setSchedule((prev) => {
      const exists = prev.find((s) => s.day === day);
      if (exists) return prev.filter((s) => s.day !== day);
      return [...prev, { day, startTime: '09:00', endTime: '10:00' }];
    });
  };

  const updateSlotTime = (day: Day, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) => prev.map((s) => s.day === day ? { ...s, [field]: value } : s));
  };

  // ── Navigation ────────────────────────────────────────────────────────────────

  const resolveDestination = async () => {
    try {
      const result = await get<{ hasCertificaciones?: boolean }>(API_ENDPOINTS.tutorMe);
      if (result.data?.hasCertificaciones) {
        router.replace('/(tutor)/dashboard' as any);
      } else {
        router.replace('/(auth)/request-submitted' as any);
      }
    } catch {
      router.replace('/(auth)/request-submitted' as any);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    setSubmitted(true);
    if (!canPublish) return;
    setLoading(true);
    setError(null);

    const course = await create({
      subject: selectedSubject,
      description: description.trim(),
      objectives: objectives.trim() || undefined,
      price: Number(price),
      duration,
      modalidad,
      academicLevel: level || undefined,
      schedule,
    });

    setLoading(false);
    if (!course) {
      setError('No se pudo crear el curso. Verifica tu conexión e intenta de nuevo.');
      return;
    }
    await resolveDestination();
  };

  const handleSkip = () => resolveDestination();

  // ── Progress bar ─────────────────────────────────────────────────────────────

  const ProgressBar = () => (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: 12 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={{
          height: 4, borderRadius: 2,
          width: i === TOTAL_STEPS - 1 ? 32 : 20,
          backgroundColor: i <= TOTAL_STEPS - 1 ? '#006A75' : '#CBD5E1',
        }} />
      ))}
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }} accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}><ProgressBar /></View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={{ paddingTop: 8, paddingBottom: 20 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
              Crea tu primer curso
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 21 }}>
              Sin cursos los estudiantes no pueden encontrarte. Puedes editarlo o agregar más desde tu perfil.
            </Text>
          </View>

          {error && (
            <View style={{
              backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
            </View>
          )}

          {/* Subject accordion */}
          <Label text="Materia / Tema" error={errors.subject} />
          {selectedSubject ? (
            <View style={{ marginBottom: 16 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#006A75', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
              }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{selectedSubject}</Text>
                <TouchableOpacity onPress={() => setSelectedSubject('')}>
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ marginBottom: 16 }}>
              {COURSE_CATEGORIES.map((cat) => {
                const isOpen = expandedCategory === cat.id;
                return (
                  <View key={cat.id} style={{
                    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
                    borderColor: errors.subject ? '#F87171' : '#E2E8F0',
                    marginBottom: 8, overflow: 'hidden',
                  }}>
                    <TouchableOpacity
                      onPress={() => setExpandedCategory(isOpen ? null : cat.id)}
                      activeOpacity={0.8}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}
                    >
                      <CategoryIcon id={cat.id} size={20} color="#94A3B8" />
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#0F172A' }}>
                        {cat.label}
                      </Text>
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
                    </TouchableOpacity>

                    {isOpen && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 14 }}>
                        {cat.subjects.map((subject) => (
                          <TouchableOpacity
                            key={subject}
                            onPress={() => { setSelectedSubject(subject); setExpandedCategory(null); }}
                            activeOpacity={0.8}
                            style={{
                              paddingHorizontal: 12, paddingVertical: 7,
                              borderRadius: 99, borderWidth: 1,
                              backgroundColor: '#F8FAFC', borderColor: '#CBD5E1',
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>
                              {subject}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Description */}
          <Label text="Descripción" error={errors.description} />
          <TextInput
            style={{
              ...inputStyle, minHeight: 90, textAlignVertical: 'top', marginBottom: 4,
              borderColor: errors.description ? '#F87171' : '#E2E8F0',
            }}
            placeholder="¿De qué trata el curso? Contexto, enfoque, metodología..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
            value={description}
            onChangeText={setDescription}
          />
          <Text style={{
            fontSize: 11, textAlign: 'right', marginBottom: 16,
            color: description.trim().length >= 20 ? '#94A3B8' : '#F87171',
          }}>
            {description.trim().length}/20 mín.
          </Text>

          {/* Objectives */}
          <Label text="¿Qué aprenderán?" optional />
          <TextInput
            style={{ ...inputStyle, minHeight: 70, textAlignVertical: 'top', marginBottom: 20 }}
            placeholder="Ej: derivadas, integrales, límites..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={400}
            value={objectives}
            onChangeText={setObjectives}
          />

          {/* Price + Duration */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Label text="Precio COP" error={errors.price} />
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                ...(errors.price ? inputErrorStyle : inputStyle),
              }}>
                <Text style={{ color: '#94A3B8', marginRight: 4 }}>$</Text>
                <TextInput
                  style={{ flex: 1, color: '#0F172A', fontSize: 14 }}
                  placeholder="50000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Duración" />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {([30, 60, 90] as Duration[]).map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDuration(d)}
                    style={{
                      flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
                      alignItems: 'center',
                      backgroundColor: duration === d ? '#006A75' : '#fff',
                      borderColor: duration === d ? '#006A75' : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: duration === d ? '#fff' : '#94A3B8' }}>
                      {d}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Modalidad */}
          <Label text="Modalidad" error={errors.modalidad} />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {MODALIDADES.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setModalidad(m)}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
                  alignItems: 'center',
                  backgroundColor: modalidad === m ? '#006A75' : '#fff',
                  borderColor: errors.modalidad ? '#F87171' : modalidad === m ? '#006A75' : '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: modalidad === m ? '#fff' : '#94A3B8' }}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Academic level */}
          <Label text="Nivel académico" optional />
          <View style={{ marginBottom: 20 }}>
            <SelectInput options={ACADEMIC_LEVELS} value={level} onChange={setLevel} placeholder="Cualquier nivel" />
          </View>

          {/* Schedule */}
          <Label text="Días disponibles" error={errors.schedule} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {DAYS.map(({ key, label }) => {
              const selected = !!schedule.find((s) => s.day === key);
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => toggleDay(key)}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderRadius: 99, borderWidth: 1,
                    backgroundColor: selected ? '#006A75' : '#fff',
                    borderColor: errors.schedule && !selected ? '#F87171' : selected ? '#006A75' : '#E2E8F0',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? '#fff' : '#94A3B8' }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {schedule.length > 0 && (
            <View style={{
              backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
              borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
              marginBottom: 20, gap: 10,
            }}>
              {schedule.map((slot) => {
                const day = DAYS.find((d) => d.key === slot.day);
                return (
                  <View key={slot.day} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', width: 28 }}>
                      {day?.label}
                    </Text>
                    <TextInput
                      style={{ ...inputStyle, paddingVertical: 8, paddingHorizontal: 10, fontSize: 13, textAlign: 'center', width: 64 }}
                      value={slot.startTime}
                      onChangeText={(v) => updateSlotTime(slot.day, 'startTime', v.replace(/[^0-9:]/g, ''))}
                      placeholder="09:00"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                    <Text style={{ color: '#94A3B8', fontSize: 13 }}>→</Text>
                    <TextInput
                      style={{ ...inputStyle, paddingVertical: 8, paddingHorizontal: 10, fontSize: 13, textAlign: 'center', width: 64 }}
                      value={slot.endTime}
                      onChangeText={(v) => updateSlotTime(slot.day, 'endTime', v.replace(/[^0-9:]/g, ''))}
                      placeholder="10:00"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                  </View>
                );
              })}
              <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Formato HH:MM</Text>
            </View>
          )}

          {/* Publish button */}
          <TouchableOpacity
            onPress={handlePublish}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              backgroundColor: canPublish ? '#006A75' : '#E2E8F0',
              borderRadius: 99, paddingVertical: 16, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize: 16, fontWeight: '600', color: canPublish ? '#fff' : '#94A3B8' }}>
                  Publicar y terminar
                </Text>
            }
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity onPress={handleSkip} style={{ alignItems: 'center', marginTop: 16 }} accessibilityLabel="Saltar este paso">
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#006A75' }}>
              Saltar por ahora
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
