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

  useFocusEffect(useCallback(() => { refetch(); }, []));
  const [form, setForm] = useState<{ city: string; organizationName: string; academicProgram: string }>({
    city: '', organizationName: '', academicProgram: '',
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';

  const startEditing = () => {
    setForm({
      city: profile?.city ? profile.city.charAt(0) + profile.city.slice(1).toLowerCase() : '',
      organizationName: profile?.organizationName ?? '',
      academicProgram: profile?.academicProgram ?? '',
    });
    setSelectedInterests(profile?.interests ?? []);
    setSaveError(null);
    setEditing(true);
  };

  const toggleInterest = (label: string) =>
    setSelectedInterests((p) => p.includes(label) ? p.filter((x) => x !== label) : [...p, label]);

  const handleSave = async () => {
    setSaveError(null);
    const ok = await update({ ...form, interests: selectedInterests });
    if (ok) setEditing(false);
    else setSaveError('No se pudieron guardar los cambios.');
  };

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
          <View className="mx-6 mt-2 mb-5 bg-white rounded-2xl p-5 border border-border items-center">
            <AvatarPlaceholder name={fullName} />
            <Text className="text-text-primary text-xl font-bold mt-3">{fullName}</Text>
            <Text className="text-text-muted text-sm mt-1">{user?.emailAddresses[0]?.emailAddress}</Text>
            <View className="mt-2 bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-xs font-semibold">Aprendiz</Text>
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
                  <View>
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                      Ciudad <Text className="font-normal normal-case">(opcional)</Text>
                    </Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                      placeholder="Ej. Bogotá" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} autoCapitalize="words" />
                  </View>
                  <View>
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                      Empresa o institución <Text className="font-normal normal-case">(opcional)</Text>
                    </Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                      placeholder="Ej. Universidad, empresa, independiente..."
                      value={form.organizationName} onChangeText={(v) => setForm({ ...form, organizationName: v })} />
                  </View>
                  <View>
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">
                      Área o carrera <Text className="font-normal normal-case">(opcional)</Text>
                    </Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                      placeholder="Ej. Ingeniería, Gastronomía, Chef..."
                      value={form.academicProgram} onChangeText={(v) => setForm({ ...form, academicProgram: v })} />
                  </View>
                  <View>
                    <Text className="text-xs text-text-muted mb-2 uppercase tracking-wide font-semibold">
                      ¿Qué quieres aprender?
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {COURSE_CATEGORIES.map((cat) => {
                        const sel = selectedInterests.includes(cat.label);
                        return (
                          <TouchableOpacity key={cat.id} onPress={() => toggleInterest(cat.label)} activeOpacity={0.8}
                            className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${sel ? 'bg-primary border-primary' : 'bg-white border-border'}`}>
                            <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                            <Text className={`text-xs font-semibold ${sel ? 'text-white' : 'text-text-muted'}`}>{cat.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}
                    className="bg-primary rounded-full py-3.5 items-center flex-row justify-center gap-2">
                    {saving ? <ActivityIndicator color="white" size="small" /> : (
                      <Text className="text-white font-semibold text-sm">Guardar cambios</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="pb-2">
                  {profile?.city && <InfoRow icon="location-outline" label="Ciudad" value={profile.city.charAt(0) + profile.city.slice(1).toLowerCase()} />}
                  {profile?.organizationName && <InfoRow icon="business-outline" label="Empresa / Institución" value={profile.organizationName} />}
                  {profile?.academicProgram && <InfoRow icon="book-outline" label="Área o carrera" value={profile.academicProgram} />}
                  {profile?.interests && profile.interests.length > 0 && (
                    <View className="py-3">
                      <View className="flex-row items-center mb-2 gap-2">
                        <Ionicons name="star-outline" size={18} color="#006A75" />
                        <Text className="text-text-muted text-xs">Quiero aprender</Text>
                      </View>
                      <View className="flex-row flex-wrap gap-2 ml-7">
                        {profile.interests.map((interest) => {
                          const cat = COURSE_CATEGORIES.find((c) => c.label === interest);
                          return (
                            <View key={interest} className="flex-row items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                              {cat && <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>}
                              <Text className="text-primary text-xs font-medium">{interest}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  {!profile?.city && !profile?.organizationName && !profile?.interests?.length && (
                    <TouchableOpacity onPress={startEditing} activeOpacity={0.8} className="py-4 items-center">
                      <Text className="text-primary text-sm font-medium">+ Completa tu perfil</Text>
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
      descripcion: profile?.descripcion ?? '',
      bio: profile?.bio ?? '',
    });
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    const ok = await update(form);
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
          <View className="mx-6 mt-2 mb-5 bg-white rounded-2xl p-5 border border-border items-center">
            <AvatarPlaceholder name={fullName} />
            <Text className="text-text-primary text-xl font-bold mt-3">{fullName}</Text>
            <Text className="text-text-muted text-sm mt-1">{profile?.user?.email ?? user?.emailAddresses[0]?.emailAddress}</Text>
            <View className={`mt-2 px-3 py-1 rounded-full ${profile?.estado === 'VERIFICADO' ? 'bg-green-100' : 'bg-amber-100'}`}>
              <Text className={`text-xs font-semibold ${profile?.estado === 'VERIFICADO' ? 'text-green-700' : 'text-amber-700'}`}>
                {profile?.estado === 'VERIFICADO' ? 'Verificado' : 'En revisión'}
              </Text>
            </View>
          </View>

          {error && (
            <View className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          )}

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
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">Nombre</Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                      value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} autoCapitalize="words" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">Apellido</Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                      value={form.apellido} onChangeText={(v) => setForm({ ...form, apellido: v })} autoCapitalize="words" />
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">Cédula</Text>
                    <TextInput className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                      value={form.cedula} onChangeText={(v) => setForm({ ...form, cedula: v })} keyboardType="numeric" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">Ciudad</Text>
                    <SelectInput options={CITIES} value={form.ciudad ?? ''} onChange={(v) => setForm({ ...form, ciudad: v })} placeholder="Selecciona" />
                  </View>
                </View>
                <View>
                  <Text className="text-xs text-text-muted mb-1.5 uppercase tracking-wide font-semibold">Bibliografía</Text>
                  <TextInput
                    className="bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                    value={form.bio ?? form.descripcion}
                    onChangeText={(v) => setForm({ ...form, bio: v, descripcion: v })}
                    multiline numberOfLines={4} textAlignVertical="top"
                    style={{ minHeight: 100 }}
                  />
                </View>
                <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}
                  className="bg-primary rounded-full py-3.5 items-center flex-row justify-center gap-2">
                  {saving ? <ActivityIndicator color="white" size="small" /> : (
                    <Text className="text-white font-semibold text-sm">Guardar cambios</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="pb-2">
                {profile?.nombre && <InfoRow icon="person-outline" label="Nombre completo" value={`${profile.nombre} ${profile.apellido}`} />}
                {profile?.cedula && <InfoRow icon="card-outline" label="Cédula" value={profile.cedula} />}
                {profile?.user?.city && <InfoRow icon="location-outline" label="Ciudad" value={profile.user.city.charAt(0) + profile.user.city.slice(1).toLowerCase()} />}
                {profile?.user?.email && <InfoRow icon="mail-outline" label="Correo" value={profile.user.email} />}
                {(profile?.bio || profile?.descripcion) && (
                  <View className="py-3 border-b border-border">
                    <View className="flex-row items-center gap-2 mb-1.5">
                      <Ionicons name="document-text-outline" size={18} color="#006A75" />
                      <Text className="text-text-muted text-xs">Bibliografía</Text>
                    </View>
                    <Text className="text-text-primary text-sm leading-5 ml-7">
                      {profile?.bio ?? profile?.descripcion}
                    </Text>
                  </View>
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
