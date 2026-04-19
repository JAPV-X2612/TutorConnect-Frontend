import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogout } from '@/hooks/use-logout';
import { useProfile } from '@/hooks/use-profile';

function AvatarPlaceholder({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
      <Text className="text-white text-3xl font-bold">{initial}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-start py-3 border-b border-border last:border-b-0">
      <Ionicons name={icon as any} size={18} color="#006A75" style={{ marginTop: 1 }} />
      <View className="ml-3 flex-1">
        <Text className="text-text-muted text-xs mb-0.5">{label}</Text>
        <Text className="text-text-primary text-sm font-medium">{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { logout, loading: loggingOut } = useLogout();
  const { profile, loading: profileLoading, error: profileError } = useProfile();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';
  const email = user?.emailAddresses[0]?.emailAddress ?? '';

  const handleConfirm = async () => {
    setConfirmVisible(false);
    await logout();
  };

  const formatCity = (city?: string | null) =>
    city ? city.charAt(0) + city.slice(1).toLowerCase() : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-text-primary">Mi perfil</Text>
        </View>

        {/* User card */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-5 border border-border items-center">
          <AvatarPlaceholder name={fullName} />
          <Text className="text-text-primary text-xl font-bold mt-3">{fullName}</Text>
          {email ? (
            <Text className="text-text-muted text-sm mt-1">{email}</Text>
          ) : null}
          {profile?.role && (
            <View className="mt-2 bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-xs font-semibold">
                {profile.role === 'LEARNER' ? 'Aprendiz' : 'Tutor'}
              </Text>
            </View>
          )}
        </View>

        {/* Profile data */}
        {profileLoading ? (
          <View className="mx-6 mt-4 bg-white rounded-2xl p-5 border border-border items-center">
            <ActivityIndicator size="small" color="#006A75" />
            <Text className="text-text-muted text-sm mt-2">Cargando información...</Text>
          </View>
        ) : profileError ? (
          <View className="mx-6 mt-4 bg-red-50 rounded-2xl p-4 border border-red-200">
            <Text className="text-red-600 text-sm text-center">{profileError}</Text>
          </View>
        ) : profile ? (
          <View className="mx-6 mt-4 bg-white rounded-2xl px-5 border border-border">
            <Text className="text-text-muted text-xs font-semibold pt-4 pb-2 uppercase tracking-wide">
              Información académica
            </Text>

            {profile.organizationName && (
              <InfoRow
                icon="school-outline"
                label="Universidad / Institución"
                value={
                  profile.organizationName.charAt(0) +
                  profile.organizationName.slice(1).toLowerCase()
                }
              />
            )}
            {profile.academicProgram && (
              <InfoRow
                icon="book-outline"
                label="Programa académico"
                value={profile.academicProgram}
              />
            )}
            {profile.currentSemester != null && (
              <InfoRow
                icon="layers-outline"
                label="Semestre actual"
                value={`Semestre ${profile.currentSemester}`}
              />
            )}
            {profile.city && (
              <InfoRow
                icon="location-outline"
                label="Ciudad"
                value={formatCity(profile.city) ?? profile.city}
              />
            )}
            {profile.country && (
              <InfoRow icon="flag-outline" label="País" value={profile.country} />
            )}
            {profile.interests && profile.interests.length > 0 && (
              <View className="py-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="star-outline" size={18} color="#006A75" />
                  <Text className="text-text-muted text-xs ml-3 mb-0.5">Intereses</Text>
                </View>
                <View className="flex-row flex-wrap gap-2 ml-7">
                  {profile.interests.map((interest) => (
                    <View
                      key={interest}
                      className="bg-primary/10 px-3 py-1 rounded-full"
                    >
                      <Text className="text-primary text-xs font-medium">{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : null}

        {/* Logout */}
        <View className="mx-6 mt-6 bg-white rounded-2xl border border-border overflow-hidden">
          <TouchableOpacity
            onPress={() => setConfirmVisible(true)}
            disabled={loggingOut}
            activeOpacity={0.7}
            className="flex-row items-center px-5 py-4 gap-3"
          >
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            <Text className="text-red-600 text-base font-semibold flex-1">
              {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation modal */}
      <Modal
        transparent
        animationType="fade"
        visible={confirmVisible}
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-text-primary text-lg font-bold mb-2 text-center">
              ¿Cerrar sesión?
            </Text>
            <Text className="text-text-muted text-sm text-center mb-6">
              Podrás ingresar con otra cuenta en cualquier momento.
            </Text>

            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.85}
              className="bg-red-600 rounded-full py-3 mb-3 items-center"
            >
              <Text className="text-white font-semibold text-base">Sí, cerrar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setConfirmVisible(false)}
              activeOpacity={0.85}
              className="bg-gray-100 rounded-full py-3 items-center"
            >
              <Text className="text-text-primary font-semibold text-base">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
