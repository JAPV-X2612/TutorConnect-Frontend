import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLogout } from '@/hooks/use-logout';
import { useProfile } from '@/hooks/use-profile';
import { useTutorProfile, UpdateTutorPayload } from '@/hooks/use-tutor-profile';
import { SelectInput } from '@/components/ui/select-input';
import { CITIES, COURSE_CATEGORIES } from '@/constants/registration-options';
import { CategoryIcon, StudentTypeIcon } from '@/constants/category-icons';

// ── Constants ─────────────────────────────────────────────────────────────────

const STUDENT_TYPES = [
  { value: 'universitario', label: 'Universitario' },
  { value: 'colegial',      label: 'Colegial' },
  { value: 'profesional',   label: 'Profesional' },
  { value: 'otro',          label: 'Otro' },
] as const;

const SCHOOL_GRADES = [6, 7, 8, 9, 10, 11];

// ── Shared sub-components ─────────────────────────────────────────────────────

function AvatarPlaceholder({ name }: Readonly<{ name: string }>) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
      <Text className="text-white text-3xl font-bold">{initial}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: Readonly<{ icon: string; label: string; value: string }>) {
  return (
    <View className="flex-row items-start py-3 border-b border-border last:border-b-0">
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={18}
        color="#006A75"
        style={{ marginTop: 1 }}
      />
      <View className="ml-3 flex-1">
        <Text className="text-text-muted text-xs mb-0.5">{label}</Text>
        <Text className="text-text-primary text-sm font-medium">{value}</Text>
      </View>
    </View>
  );
}

function LogoutButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <View className="mx-6 mt-6 bg-white rounded-2xl border border-border overflow-hidden">
      <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.7}
        className="flex-row items-center px-5 py-4 gap-3">
        <Ionicons name="log-out-outline" size={22} color="#DC2626" />
        <Text className="text-red-600 text-base font-semibold flex-1">
          {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#DC2626" />
      </TouchableOpacity>
    </View>
  );
}

// ── Learner profile ───────────────────────────────────────────────────────────

export function LearnerProfileScreen() {
  const { user } = useUser();
  const { logout, loading: loggingOut } = useLogout();
  const { profile, loading, saving, error, update, refetch } = useProfile();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { refetch(); }, []));

  const [form, setForm] = useState({
    city: '',
    organizationName: '',
    academicProgram: '',
    learningGoal: '',
    studentType: '',
    currentSemester: '',
    schoolGrade: null as number | null,
  });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';

  const startEditing = () => {
    setForm({
      city: profile?.city ? profile.city.charAt(0) + profile.city.slice(1).toLowerCase() : '',
      organizationName: profile?.organizationName ?? '',
      academicProgram: profile?.academicProgram ?? '',
      learningGoal: profile?.learningGoal ?? '',
      studentType: profile?.studentType ?? '',
      currentSemester: profile?.currentSemester ? String(profile.currentSemester) : '',
      schoolGrade: profile?.schoolGrade ?? null,
    });
    setSelectedSubjects(profile?.interests ?? []);
    setSaveError(null);
    setEditing(true);
  };

  const toggleSubject = (subject: string) =>
    setSelectedSubjects((p) => p.includes(subject) ? p.filter((s) => s !== subject) : [...p, subject]);

  const handleSave = async () => {
    setSaveError(null);
    const semester = parseInt(form.currentSemester, 10);
    const ok = await update({
      city: form.city || undefined,
      organizationName: form.organizationName || undefined,
      academicProgram: form.academicProgram || undefined,
      learningGoal: form.learningGoal || undefined,
      studentType: form.studentType || undefined,
      currentSemester: !isNaN(semester) && semester > 0 ? semester : undefined,
      schoolGrade: form.schoolGrade ?? undefined,
      interests: selectedSubjects,
    });
    if (ok) setEditing(false);
    else setSaveError('No se pudieron guardar los cambios.');
  };

  const studentTypeLabel = STUDENT_TYPES.find((t) => t.value === profile?.studentType);

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-text-primary">Mi perfil</Text>
          {!editing ? (
            <TouchableOpacity onPress={startEditing} activeOpacity={0.8}
              className="flex-row items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
              <Ionicons name="pencil-outline" size={15} color="#006A75" />
              <Text className="text-primary text-sm font-semibold">Editar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setEditing(false)} activeOpacity={0.8}>
              <Text className="text-text-muted text-sm">Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Avatar card */}
          <View className="mx-6 mt-2 mb-5 bg-white rounded-2xl p-5 border border-border items-center">
            <AvatarPlaceholder name={fullName} />
            <Text className="text-text-primary text-xl font-bold mt-3">{fullName}</Text>
            <Text className="text-text-muted text-sm mt-1">{user?.emailAddresses[0]?.emailAddress}</Text>
            <View className="flex-row gap-2 mt-2 flex-wrap justify-center">
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs font-semibold">Aprendiz</Text>
              </View>
              {studentTypeLabel && !editing && (
                <View className="bg-gray-100 px-3 py-1 rounded-full flex-row items-center gap-1">
                  <StudentTypeIcon type={studentTypeLabel.value} size={11} color="#64748B" />
                  <Text className="text-text-muted text-xs font-semibold">{studentTypeLabel.label}</Text>
                </View>
              )}
            </View>
          </View>

          {loading ? (
            <View className="mx-6 items-center py-6"><ActivityIndicator color="#006A75" /></View>
          ) : error && !editing ? (
            <View className="mx-6 bg-red-50 rounded-2xl p-4 border border-red-200">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          ) : (
            <View className="mx-6 bg-white rounded-2xl px-5 border border-border mb-4">
              <Text className="text-text-muted text-xs font-semibold pt-4 pb-3 uppercase tracking-wide">
                Información personal
              </Text>

              {editing ? (
                <View className="gap-4 pb-5">
                  {saveError && (
                    <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <Text className="text-red-700 text-sm">{saveError}</Text>
                    </View>
                  )}

                  {/* Student type */}
                  <View>
                    <Text className="text-xs text-text-muted mb-2 uppercase tracking-wide font-semibold">
                      ¿Cómo te describes?
                    </Text>
                    <View className="gap-2">
                      {STUDENT_TYPES.map((opt) => {
                        const selected = form.studentType === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            onPress={() => setForm({ ...form, studentType: opt.value })}
                            activeOpacity={0.8}
                            style={{
                              flexDirection: 'row', alignItems: 'center', gap: 12,
                              padding: 12, borderRadius: 14, borderWidth: 1.5,
                              backgroundColor: selected ? '#F0FDFA' : '#F8FAFC',
                              borderColor: selected ? '#006A75' : '#E2E8F0',
                            }}
                          >
                            <StudentTypeIcon type={opt.value} size={20} color={selected ? '#006A75' : '#475569'} />
                            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: selected ? '#006A75' : '#0F172A' }}>
                              {opt.label}
                            </Text>
                            {selected && <Ionicons name="checkmark-circle" size={18} color="#006A75" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Learning goal */}
                  <View>
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                      Meta de aprendizaje <Text className="font-normal normal-case">(opcional)</Text>
                    </Text>
                    <TextInput
                      className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary" placeholderTextColor="#94A3B8"
                      placeholder="Ej: Quiero aprender cálculo para ingeniería..."
                      multiline numberOfLines={3} textAlignVertical="top"
                      maxLength={500}
                      value={form.learningGoal}
                      onChangeText={(v) => setForm({ ...form, learningGoal: v })}
                      style={{ minHeight: 80 }}
                    />
                  </View>

                  {/* Universitario fields */}
                  {form.studentType === 'universitario' && (
                    <>
                      <View>
                        <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                          Carrera <Text className="font-normal normal-case">(opcional)</Text>
                        </Text>
                        <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary" placeholderTextColor="#94A3B8"
                          placeholder="Ej: Ingeniería Civil, Medicina..."
                          value={form.academicProgram}
                          onChangeText={(v) => setForm({ ...form, academicProgram: v })} />
                      </View>
                      <View>
                        <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                          Universidad <Text className="font-normal normal-case">(opcional)</Text>
                        </Text>
                        <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary" placeholderTextColor="#94A3B8"
                          placeholder="Ej: Universidad Nacional, Los Andes..."
                          value={form.organizationName}
                          onChangeText={(v) => setForm({ ...form, organizationName: v })} />
                      </View>
                      <View>
                        <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                          Semestre <Text className="font-normal normal-case">(opcional)</Text>
                        </Text>
                        <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary" placeholderTextColor="#94A3B8"
                          placeholder="Ej: 3" keyboardType="number-pad" maxLength={2}
                          value={form.currentSemester}
                          onChangeText={(v) => setForm({ ...form, currentSemester: v })} />
                      </View>
                    </>
                  )}

                  {/* Colegial fields */}
                  {form.studentType === 'colegial' && (
                    <>
                      <View>
                        <Text className="text-xs text-text-muted mb-2 uppercase tracking-wide font-semibold">
                          Grado <Text className="font-normal normal-case">(opcional)</Text>
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {SCHOOL_GRADES.map((g) => (
                            <TouchableOpacity
                              key={g}
                              onPress={() => setForm({ ...form, schoolGrade: form.schoolGrade === g ? null : g })}
                              activeOpacity={0.8}
                              style={{
                                paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5,
                                backgroundColor: form.schoolGrade === g ? '#006A75' : '#F8FAFC',
                                borderColor: form.schoolGrade === g ? '#006A75' : '#E2E8F0',
                              }}
                            >
                              <Text style={{ fontSize: 13, fontWeight: '600', color: form.schoolGrade === g ? '#fff' : '#475569' }}>
                                {g}°
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View>
                        <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                          Colegio <Text className="font-normal normal-case">(opcional)</Text>
                        </Text>
                        <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary" placeholderTextColor="#94A3B8"
                          placeholder="Nombre del colegio..."
                          value={form.organizationName}
                          onChangeText={(v) => setForm({ ...form, organizationName: v })} />
                      </View>
                    </>
                  )}

                  {/* Profesional / otro fields */}
                  {(form.studentType === 'profesional' || form.studentType === 'otro') && (
                    <View>
                      <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                        Área profesional <Text className="font-normal normal-case">(opcional)</Text>
                      </Text>
                      <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary" placeholderTextColor="#94A3B8"
                        placeholder="Ej: Diseño, Contabilidad, Marketing..."
                        value={form.academicProgram}
                        onChangeText={(v) => setForm({ ...form, academicProgram: v })} />
                    </View>
                  )}

                  {/* No type selected — generic fields */}
                  {!form.studentType && (
                    <>
                      <View>
                        <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                          Institución / Empresa <Text className="font-normal normal-case">(opcional)</Text>
                        </Text>
                        <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary" placeholderTextColor="#94A3B8"
                          placeholder="Ej. Universidad, empresa..."
                          value={form.organizationName}
                          onChangeText={(v) => setForm({ ...form, organizationName: v })} />
                      </View>
                      <View>
                        <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                          Área o carrera <Text className="font-normal normal-case">(opcional)</Text>
                        </Text>
                        <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary" placeholderTextColor="#94A3B8"
                          placeholder="Ej. Ingeniería, Gastronomía..."
                          value={form.academicProgram}
                          onChangeText={(v) => setForm({ ...form, academicProgram: v })} />
                      </View>
                    </>
                  )}

                  {/* Ciudad */}
                  <View>
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                      Ciudad <Text className="font-normal normal-case">(opcional)</Text>
                    </Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary" placeholderTextColor="#94A3B8"
                      placeholder="Ej. Bogotá" autoCapitalize="words"
                      value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
                  </View>

                  {/* Subjects accordion */}
                  <View>
                    <Text className="text-xs text-text-muted mb-2 uppercase tracking-wide font-semibold">
                      Materias de interés
                    </Text>
                    {COURSE_CATEGORIES.map((cat) => {
                      const isOpen = expandedCategory === cat.id;
                      const selCount = cat.subjects.filter((s) => selectedSubjects.includes(s)).length;
                      return (
                        <View key={cat.id} style={{
                          borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8,
                          borderColor: selCount > 0 ? '#99F6E4' : '#E2E8F0',
                          backgroundColor: '#fff',
                        }}>
                          <TouchableOpacity
                            onPress={() => setExpandedCategory(isOpen ? null : cat.id)}
                            activeOpacity={0.8}
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}
                          >
                            <CategoryIcon id={cat.id} size={16} color={selCount > 0 ? '#006A75' : '#94A3B8'} />
                            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{cat.label}</Text>
                            {selCount > 0 && (
                              <View style={{ backgroundColor: '#006A75', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{selCount}</Text>
                              </View>
                            )}
                            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
                          </TouchableOpacity>
                          {isOpen && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 12 }}>
                              {cat.subjects.map((subject) => {
                                const sel = selectedSubjects.includes(subject);
                                return (
                                  <TouchableOpacity
                                    key={subject}
                                    onPress={() => toggleSubject(subject)}
                                    activeOpacity={0.8}
                                    style={{
                                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1,
                                      backgroundColor: sel ? '#006A75' : '#F8FAFC',
                                      borderColor: sel ? '#006A75' : '#CBD5E1',
                                    }}
                                  >
                                    <Text style={{ fontSize: 12, fontWeight: '500', color: sel ? '#fff' : '#475569' }}>
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
                      <Text style={{ color: '#006A75', fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                        {selectedSubjects.length} materia{selectedSubjects.length !== 1 ? 's' : ''} seleccionada{selectedSubjects.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}
                    className="bg-primary rounded-full py-3.5 items-center flex-row justify-center gap-2">
                    {saving ? <ActivityIndicator color="white" size="small" /> : (
                      <Text className="text-white font-semibold text-sm">Guardar cambios</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // ── Read-only view ─────────────────────────────────────────
                <View className="pb-2">
                  {profile?.city && (
                    <InfoRow icon="location-outline" label="Ciudad"
                      value={profile.city.charAt(0) + profile.city.slice(1).toLowerCase()} />
                  )}
                  {profile?.organizationName && (
                    <InfoRow icon="business-outline" label={
                      profile.studentType === 'universitario' ? 'Universidad' :
                      profile.studentType === 'colegial' ? 'Colegio' : 'Empresa / Institución'
                    } value={profile.organizationName} />
                  )}
                  {profile?.academicProgram && (
                    <InfoRow icon="book-outline" label={
                      profile.studentType === 'universitario' ? 'Carrera' :
                      profile.studentType === 'profesional' ? 'Área profesional' : 'Área o carrera'
                    } value={profile.academicProgram} />
                  )}
                  {profile?.currentSemester && (
                    <InfoRow icon="layers-outline" label="Semestre" value={`Semestre ${profile.currentSemester}`} />
                  )}
                  {profile?.schoolGrade && (
                    <InfoRow icon="school-outline" label="Grado" value={`Grado ${profile.schoolGrade}°`} />
                  )}
                  {profile?.learningGoal && (
                    <View className="py-3 border-b border-border">
                      <View className="flex-row items-center gap-2 mb-1.5">
                        <Ionicons name="rocket-outline" size={18} color="#006A75" />
                        <Text className="text-text-muted text-xs">Meta de aprendizaje</Text>
                      </View>
                      <Text className="text-text-primary text-sm leading-5 ml-7">{profile.learningGoal}</Text>
                    </View>
                  )}
                  {profile?.interests && profile.interests.length > 0 && (
                    <View className="py-3">
                      <View className="flex-row items-center mb-2 gap-2">
                        <Ionicons name="star-outline" size={18} color="#006A75" />
                        <Text className="text-text-muted text-xs">Materias de interés</Text>
                      </View>
                      <View className="flex-row flex-wrap gap-2 ml-7">
                        {profile.interests.map((subject) => {
                          const cat = COURSE_CATEGORIES.find((c) => c.subjects.includes(subject));
                          return (
                            <View key={subject} className="flex-row items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                              {cat && <CategoryIcon id={cat.id} size={11} color="#006A75" />}
                              <Text className="text-primary text-xs font-medium">{subject}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  {!profile?.city && !profile?.organizationName && !profile?.interests?.length && !profile?.learningGoal && (
                    <TouchableOpacity onPress={startEditing} activeOpacity={0.8} className="py-4 items-center">
                      <Text className="text-primary text-sm font-medium">+ Completa tu perfil para mejores recomendaciones</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          <LogoutButton onPress={() => setConfirmVisible(true)} loading={loggingOut} />
        </ScrollView>

        <Modal transparent animationType="fade" visible={confirmVisible} onRequestClose={() => setConfirmVisible(false)}>
          <View className="flex-1 bg-black/50 items-center justify-center px-8">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-text-primary text-lg font-bold mb-2 text-center">¿Cerrar sesión?</Text>
              <TouchableOpacity onPress={async () => { setConfirmVisible(false); await logout(); }} className="bg-red-600 rounded-full py-3 mb-3 items-center">
                <Text className="text-white font-semibold text-base">Sí, cerrar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConfirmVisible(false)} className="bg-gray-100 rounded-full py-3 items-center">
                <Text className="text-text-primary font-semibold text-base">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ── Tutor profile ─────────────────────────────────────────────────────────────

export function TutorProfileScreen() {
  const { user } = useUser();
  const { logout, loading: loggingOut } = useLogout();
  const { profile, loading, saving, error, update, refetch } = useTutorProfile();
  const [editing, setEditing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, []));

  const [form, setForm] = useState<UpdateTutorPayload>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEditing = () => {
    setForm({
      nombre: profile?.nombre ?? '',
      apellido: profile?.apellido ?? '',
      cedula: profile?.cedula ?? '',
      ciudad: profile?.user?.city
        ? profile.user.city.charAt(0) + profile.user.city.slice(1).toLowerCase()
        : '',
      bio: profile?.bio ?? '',
      descripcion: profile?.descripcion ?? '',
      disponible: profile?.disponible ?? false,
    });
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    const ok = await update({
      nombre: form.nombre,
      apellido: form.apellido,
      cedula: form.cedula,
      ciudad: form.ciudad,
      bio: form.bio,
      descripcion: form.descripcion,
      disponible: form.disponible,
    });
    if (ok) setEditing(false);
    else setSaveError('No se pudieron guardar los cambios. Intenta de nuevo.');
  };

  const fullName = [profile?.nombre ?? user?.firstName, profile?.apellido ?? user?.lastName]
    .filter(Boolean).join(' ') || 'Tutor';

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#006A75" />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-text-primary">Mi perfil</Text>
          {!editing ? (
            <TouchableOpacity onPress={startEditing} activeOpacity={0.8}
              className="flex-row items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
              <Ionicons name="pencil-outline" size={15} color="#006A75" />
              <Text className="text-primary text-sm font-semibold">Editar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setEditing(false)} activeOpacity={0.8}>
              <Text className="text-text-muted text-sm">Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Avatar card */}
          <View className="mx-6 mt-2 mb-5 bg-white rounded-2xl p-5 border border-border items-center">
            <AvatarPlaceholder name={fullName} />
            <Text className="text-text-primary text-xl font-bold mt-3">{fullName}</Text>
            <Text className="text-text-muted text-sm mt-1">
              {profile?.user?.email ?? user?.emailAddresses[0]?.emailAddress}
            </Text>
            <View className="flex-row gap-2 mt-2 flex-wrap justify-center">
              <View className={`px-3 py-1 rounded-full ${profile?.estado === 'VERIFICADO' ? 'bg-green-100' : 'bg-amber-100'}`}>
                <Text className={`text-xs font-semibold ${profile?.estado === 'VERIFICADO' ? 'text-green-700' : 'text-amber-700'}`}>
                  {profile?.estado === 'VERIFICADO' ? 'Verificado' : 'En revisión'}
                </Text>
              </View>
              {!editing && (
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99,
                  backgroundColor: profile?.disponible ? '#DCFCE7' : '#F1F5F9',
                }}>
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: profile?.disponible ? '#166534' : '#64748B',
                  }}>
                    {profile?.disponible ? 'Disponible' : 'No disponible'}
                  </Text>
                </View>
              )}
              {profile?.rating != null && (
                <View className="flex-row items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                  <Text style={{ color: '#F59E0B', fontSize: 11 }}>★</Text>
                  <Text style={{ color: '#92400E', fontSize: 11, fontWeight: '700' }}>
                    {profile.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {error && (
            <View className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          )}

          <View className="mx-6 bg-white rounded-2xl px-5 border border-border mb-4">
            {editing ? (
              <View className="gap-4 py-5">
                {saveError && (
                  <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <Text className="text-red-700 text-sm">{saveError}</Text>
                  </View>
                )}

                {/* ── Sección: identidad ──────────────────────────────── */}
                <Text className="text-xs text-text-muted uppercase tracking-wide font-semibold">
                  Información personal
                </Text>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">Nombre</Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                      placeholderTextColor="#94A3B8" autoCapitalize="words"
                      value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">Apellido</Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                      placeholderTextColor="#94A3B8" autoCapitalize="words"
                      value={form.apellido} onChangeText={(v) => setForm({ ...form, apellido: v })} />
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">Cédula</Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                      placeholderTextColor="#94A3B8" keyboardType="numeric"
                      value={form.cedula} onChangeText={(v) => setForm({ ...form, cedula: v })} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">Ciudad</Text>
                    <SelectInput options={CITIES} value={form.ciudad ?? ''} onChange={(v) => setForm({ ...form, ciudad: v })} placeholder="Selecciona" />
                  </View>
                </View>

                {/* ── Sección: disponibilidad ────────────────────────── */}
                <Text className="text-xs text-text-muted uppercase tracking-wide font-semibold mt-2">
                  Disponibilidad
                </Text>

                {/* Disponible toggle */}
                <TouchableOpacity
                  onPress={() => setForm({ ...form, disponible: !form.disponible })}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    padding: 14, borderRadius: 14, borderWidth: 1,
                    backgroundColor: form.disponible ? '#F0FDFA' : '#F8FAFC',
                    borderColor: form.disponible ? '#99F6E4' : '#E2E8F0',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>
                      Disponible para nuevos estudiantes
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {form.disponible ? 'Apareces como disponible en la búsqueda' : 'No apareces como disponible'}
                    </Text>
                  </View>
                  <View style={{
                    width: 42, height: 24, borderRadius: 12,
                    backgroundColor: form.disponible ? '#006A75' : '#CBD5E1',
                    justifyContent: 'center', paddingHorizontal: 3,
                  }}>
                    <View style={{
                      width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
                      alignSelf: form.disponible ? 'flex-end' : 'flex-start',
                    }} />
                  </View>
                </TouchableOpacity>

                {/* ── Sección: sobre mí ──────────────────────────────── */}
                <Text className="text-xs text-text-muted uppercase tracking-wide font-semibold mt-2">
                  Sobre mí
                </Text>

                <TextInput
                  className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                  placeholderTextColor="#94A3B8"
                  placeholder="Cuéntales a los estudiantes sobre tu trayectoria, experiencia y cómo enseñas..."
                  value={form.bio || form.descripcion}
                  onChangeText={(v) => setForm({ ...form, bio: v, descripcion: v })}
                  multiline numberOfLines={5} textAlignVertical="top"
                  style={{ minHeight: 120 }}
                />

                <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}
                  className="bg-primary rounded-full py-3.5 items-center flex-row justify-center gap-2">
                  {saving ? <ActivityIndicator color="white" size="small" /> : (
                    <Text className="text-white font-semibold text-sm">Guardar cambios</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // ── Read-only view ──────────────────────────────────────
              <View className="pb-2">
                <Text className="text-text-muted text-xs font-semibold pt-4 pb-3 uppercase tracking-wide">
                  Información personal
                </Text>

                {profile?.nombre && (
                  <InfoRow icon="person-outline" label="Nombre completo" value={`${profile.nombre} ${profile.apellido}`} />
                )}
                {profile?.cedula && (
                  <InfoRow icon="card-outline" label="Cédula" value={profile.cedula} />
                )}
                {profile?.user?.city && (
                  <InfoRow icon="location-outline" label="Ciudad"
                    value={profile.user.city.charAt(0) + profile.user.city.slice(1).toLowerCase()} />
                )}
                {profile?.user?.email && (
                  <InfoRow icon="mail-outline" label="Correo" value={profile.user.email} />
                )}
                {/* Bio */}
                {(profile?.bio || profile?.descripcion) && (
                  <View className="py-3 border-t border-border">
                    <View className="flex-row items-center gap-2 mb-1.5">
                      <Ionicons name="document-text-outline" size={18} color="#006A75" />
                      <Text className="text-text-muted text-xs">Sobre mí</Text>
                    </View>
                    <Text className="text-text-primary text-sm leading-5 ml-7">
                      {profile?.bio ?? profile?.descripcion}
                    </Text>
                  </View>
                )}

                {!profile?.bio && !profile?.descripcion && (
                  <TouchableOpacity onPress={startEditing} activeOpacity={0.8} className="py-4 items-center">
                    <Text className="text-primary text-sm font-medium">+ Completa tu perfil para atraer más estudiantes</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <LogoutButton onPress={() => setConfirmVisible(true)} loading={loggingOut} />
        </ScrollView>

        <Modal transparent animationType="fade" visible={confirmVisible} onRequestClose={() => setConfirmVisible(false)}>
          <View className="flex-1 bg-black/50 items-center justify-center px-8">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-text-primary text-lg font-bold mb-2 text-center">¿Cerrar sesión?</Text>
              <TouchableOpacity onPress={async () => { setConfirmVisible(false); await logout(); }}
                className="bg-red-600 rounded-full py-3 mb-3 items-center">
                <Text className="text-white font-semibold text-base">Sí, cerrar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConfirmVisible(false)}
                className="bg-gray-100 rounded-full py-3 items-center">
                <Text className="text-text-primary font-semibold text-base">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ── Role dispatcher ───────────────────────────────────────────────────────────

/**
 * Role-aware profile screen. Used by both `(learner)/profile.tsx` and
 * `(tutor)/profile.tsx` — the RoleGuard in each layout already ensures only
 * the correct role reaches this component, but the internal dispatch is
 * kept as a safety net.
 *
 * @author TutorConnect Team
 */
export function ProfileScreen() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#006A75" />
      </SafeAreaView>
    );
  }

  const isTutor = (user?.publicMetadata?.role as string | undefined) === 'tutor';
  return isTutor ? <TutorProfileScreen /> : <LearnerProfileScreen />;
}
