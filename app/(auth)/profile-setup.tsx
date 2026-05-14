import { useClerk, useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COURSE_CATEGORIES } from '@/constants/registration-options';
import { CategoryIcon, StudentTypeIcon } from '@/constants/category-icons';

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentType = 'universitario' | 'colegial' | 'profesional' | 'otro';
type Step = 'type' | 'interests' | 'goal';

interface StudentTypeOption {
  value: StudentType;
  label: string;
  description: string;
}

const STUDENT_TYPES: StudentTypeOption[] = [
  {
    value: 'universitario',
    label: 'Universitario',
    description: 'Estudio en una universidad o institución técnica/tecnológica',
  },
  {
    value: 'colegial',
    label: 'Colegial',
    description: 'Estoy en bachillerato (grados 6 al 11)',
  },
  {
    value: 'profesional',
    label: 'Profesional',
    description: 'Trabajo y quiero aprender algo nuevo o mejorar mis habilidades',
  },
  {
    value: 'otro',
    label: 'Otro',
    description: 'Aprendo por curiosidad, hobby o una razón distinta',
  },
];

const SCHOOL_GRADES = [6, 7, 8, 9, 10, 11];

// ── ProfileSetupScreen ────────────────────────────────────────────────────────

/**
 * Three-step learner onboarding screen.
 *
 * Step 1 — Student type: university, high-school, professional or other.
 * Step 2 — Interests: specific subjects from the course catalogue.
 * Step 3 — Goal: free-text learning goal + type-specific academic context.
 *
 * All data feeds the semantic recommendation engine.
 *
 * @author TutorConnect Team
 */
export default function ProfileSetupScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const api = useApiRequest();
  const router = useRouter();

  const [step, setStep] = useState<Step>('type');
  const [studentType, setStudentType] = useState<StudentType | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Step 3 fields — vary by student type
  const [learningGoal, setLearningGoal] = useState('');
  const [academicProgram, setAcademicProgram] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [schoolGrade, setSchoolGrade] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      // Email/password flow: complete pending sign-up and activate session.
      // Google OAuth flow: session was already activated in useLearnerRegistration,
      // so signUp is null here — skip this block.
      if (isLoaded && signUp && signUp.status === 'complete') {
        await setActive!({ session: signUp.createdSessionId });
      }

      const semester = parseInt(currentSemester, 10);
      const profilePayload = {
        // Always mark setup as done so index.tsx stops redirecting here.
        studentType: studentType || 'otro',
        interests: selectedSubjects.length > 0 ? selectedSubjects : undefined,
        learningGoal: learningGoal.trim() || undefined,
        academicProgram: academicProgram.trim() || undefined,
        organizationName: organizationName.trim() || undefined,
        currentSemester: !isNaN(semester) && semester > 0 ? semester : undefined,
        schoolGrade: schoolGrade ?? undefined,
      };

      // Try PATCH first (user already exists via webhook).
      // Fall back to POST if the webhook hasn't fired yet (email/password flows).
      const patchRes = await api.patch(API_ENDPOINTS.usersMeUpdate, profilePayload);
      if (patchRes.status === 404) {
        await api.post(API_ENDPOINTS.usersCreate, {
          clerkId: clerk.user?.id,
          email: clerk.user?.primaryEmailAddress?.emailAddress,
          firstName: clerk.user?.firstName ?? '',
          lastName: clerk.user?.lastName ?? '',
          role: 'LEARNER',
          ...profilePayload,
        });
      }

      router.replace('/');
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Progress indicator ─────────────────────────────────────────────────────

  const stepIndex = step === 'type' ? 0 : step === 'interests' ? 1 : 2;

  const ProgressBar = () => (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: 12 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{
          height: 4, borderRadius: 2,
          width: i === stepIndex ? 32 : 20,
          backgroundColor: i <= stepIndex ? '#006A75' : '#CBD5E1',
        }} />
      ))}
    </View>
  );

  // ── Step 1: Student type ───────────────────────────────────────────────────

  if (step === 'type') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <ProgressBar />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <View style={{ paddingTop: 16, paddingBottom: 24 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
              ¿Cómo te describes?
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 21 }}>
              Esto nos ayuda a recomendarte tutores y cursos que se ajusten a tu situación.
            </Text>
          </View>

          <View style={{ gap: 12, marginBottom: 32 }}>
            {STUDENT_TYPES.map((opt) => {
              const selected = studentType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setStudentType(opt.value)}
                  activeOpacity={0.8}
                  accessibilityLabel={opt.label}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 16,
                    backgroundColor: selected ? '#F0FDFA' : '#fff',
                    borderRadius: 16, borderWidth: 2,
                    borderColor: selected ? '#006A75' : '#E2E8F0',
                    padding: 18,
                  }}
                >
                  <StudentTypeIcon type={opt.value} size={28} color={selected ? '#006A75' : '#475569'} />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 15, fontWeight: '700',
                      color: selected ? '#006A75' : '#0F172A', marginBottom: 3,
                    }}>
                      {opt.label}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18 }}>
                      {opt.description}
                    </Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color="#006A75" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => setStep('interests')}
            activeOpacity={0.85}
            style={{
              backgroundColor: studentType ? '#006A75' : '#E2E8F0',
              borderRadius: 99, paddingVertical: 16, alignItems: 'center',
            }}
          >
            <Text style={{
              color: studentType ? '#fff' : '#94A3B8',
              fontSize: 16, fontWeight: '600',
            }}>
              {studentType ? 'Continuar' : 'Saltar por ahora'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 2: Subject interests ──────────────────────────────────────────────

  if (step === 'interests') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => setStep('type')} style={{ padding: 8 }} accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ProgressBar />
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <View style={{ paddingTop: 8, paddingBottom: 20 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
              ¿Qué quieres aprender?
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 21 }}>
              Selecciona las materias que te interesan. Usamos esto para encontrarte los mejores tutores.
            </Text>
          </View>

          {COURSE_CATEGORIES.map((cat) => {
            const isOpen = expandedCategory === cat.id;
            const selectedCount = cat.subjects.filter((s) => selectedSubjects.includes(s)).length;

            return (
              <View
                key={cat.id}
                style={{
                  backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
                  borderColor: selectedCount > 0 ? '#99F6E4' : '#E2E8F0',
                  marginBottom: 10, overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  onPress={() => setExpandedCategory(isOpen ? null : cat.id)}
                  activeOpacity={0.8}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}
                >
                  <CategoryIcon id={cat.id} size={22} color={selectedCount > 0 ? '#006A75' : '#94A3B8'} />
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A' }}>
                    {cat.label}
                  </Text>
                  {selectedCount > 0 && (
                    <View style={{
                      backgroundColor: '#006A75', borderRadius: 10,
                      paddingHorizontal: 7, paddingVertical: 2, marginRight: 4,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                        {selectedCount}
                      </Text>
                    </View>
                  )}
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
                </TouchableOpacity>

                {isOpen && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
                    {cat.subjects.map((subject) => {
                      const selected = selectedSubjects.includes(subject);
                      return (
                        <TouchableOpacity
                          key={subject}
                          onPress={() => toggleSubject(subject)}
                          activeOpacity={0.8}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 7,
                            borderRadius: 99, borderWidth: 1,
                            backgroundColor: selected ? '#006A75' : '#F8FAFC',
                            borderColor: selected ? '#006A75' : '#CBD5E1',
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '500', color: selected ? '#fff' : '#475569' }}>
                            {subject}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {selectedSubjects.length > 0 && (
            <Text style={{ color: '#006A75', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8, marginBottom: 4 }}>
              {selectedSubjects.length} materia{selectedSubjects.length !== 1 ? 's' : ''} seleccionada{selectedSubjects.length !== 1 ? 's' : ''}
            </Text>
          )}

          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              onPress={() => setStep('goal')}
              activeOpacity={0.85}
              style={{ backgroundColor: '#006A75', borderRadius: 99, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {selectedSubjects.length > 0 ? 'Continuar' : 'Saltar por ahora'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 3: Goal + type-specific context ──────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => setStep('interests')} style={{ padding: 8 }} accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ProgressBar />
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingTop: 8, paddingBottom: 24 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
              Cuéntanos más
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 21 }}>
              Esta información hace que tus recomendaciones sean mucho más acertadas.
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

          {/* Learning goal — all types */}
          <Label text="¿Qué quieres lograr?" optional />
          <TextInput
            style={[inputStyle, { minHeight: 90, textAlignVertical: 'top', marginBottom: 4 }]}
            placeholder={
              studentType === 'colegial'
                ? 'Ej: Quiero reforzar matemáticas y prepararme para el ICFES...'
                : studentType === 'profesional'
                ? 'Ej: Quiero aprender Python para automatizar procesos en mi trabajo...'
                : 'Ej: Quiero entender cálculo diferencial para pasar la materia este semestre...'
            }
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
            value={learningGoal}
            onChangeText={setLearningGoal}
          />
          <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'right', marginBottom: 20 }}>
            {learningGoal.length}/500
          </Text>

          {/* Universitario fields */}
          {studentType === 'universitario' && (
            <>
              <Label text="¿Qué carrera estudias?" optional />
              <TextInput
                style={[inputStyle, { marginBottom: 16 }]}
                placeholder="Ej: Ingeniería Civil, Medicina, Administración..."
                placeholderTextColor="#94A3B8"
                value={academicProgram}
                onChangeText={setAcademicProgram}
              />
              <Label text="¿En qué universidad?" optional />
              <TextInput
                style={[inputStyle, { marginBottom: 16 }]}
                placeholder="Ej: Universidad Nacional, Los Andes, EAFIT..."
                placeholderTextColor="#94A3B8"
                value={organizationName}
                onChangeText={setOrganizationName}
              />
              <Label text="¿Qué semestre cursas?" optional />
              <TextInput
                style={[inputStyle, { marginBottom: 24 }]}
                placeholder="Ej: 3"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={2}
                value={currentSemester}
                onChangeText={setCurrentSemester}
              />
            </>
          )}

          {/* Colegial fields */}
          {studentType === 'colegial' && (
            <>
              <Label text="¿Qué grado cursas?" optional />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {SCHOOL_GRADES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setSchoolGrade(schoolGrade === g ? null : g)}
                    activeOpacity={0.8}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10,
                      borderRadius: 12, borderWidth: 1.5,
                      backgroundColor: schoolGrade === g ? '#006A75' : '#fff',
                      borderColor: schoolGrade === g ? '#006A75' : '#E2E8F0',
                    }}
                  >
                    <Text style={{
                      fontSize: 14, fontWeight: '600',
                      color: schoolGrade === g ? '#fff' : '#475569',
                    }}>
                      {g}°
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Label text="¿En qué colegio?" optional />
              <TextInput
                style={[inputStyle, { marginBottom: 24 }]}
                placeholder="Nombre del colegio..."
                placeholderTextColor="#94A3B8"
                value={organizationName}
                onChangeText={setOrganizationName}
              />
            </>
          )}

          {/* Profesional fields */}
          {studentType === 'profesional' && (
            <>
              <Label text="¿Cuál es tu área profesional?" optional />
              <TextInput
                style={[inputStyle, { marginBottom: 24 }]}
                placeholder="Ej: Contabilidad, Diseño, Ingeniería de software..."
                placeholderTextColor="#94A3B8"
                value={academicProgram}
                onChangeText={setAcademicProgram}
              />
            </>
          )}

          {/* CTA */}
          <TouchableOpacity
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#006A75', borderRadius: 99,
              paddingVertical: 16, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 8,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Empezar a explorar
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFinish}
            disabled={loading}
            style={{ alignItems: 'center', paddingTop: 14 }}
          >
            <Text style={{ color: '#94A3B8', fontSize: 14 }}>Saltar por ahora</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ text, optional }: { text: string; optional?: boolean }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: '#64748B',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
    }}>
      {text}{optional && (
        <Text style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>
          {' '}(opcional)
        </Text>
      )}
    </Text>
  );
}

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
