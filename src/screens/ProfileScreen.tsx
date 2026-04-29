/**
 * @file ProfileScreen.tsx
 * @description Shared profile screen rendered for both LEARNER and TUTOR roles.
 *   Displays Clerk user data, backend profile info, and a logout action.
 * @author TutorConnect Team
 */

import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogout } from '@/hooks/use-logout';
import { useProfile, type UserProfile } from '@/hooks/use-profile';
import { AppHeader } from '@/src/components/ui/AppHeader';

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Circular avatar showing the user's first initial.
 * @param name - Full display name used to derive the initial.
 */
function AvatarPlaceholder({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
      <Text className="text-white text-3xl font-bold">{initial}</Text>
    </View>
  );
}

/**
 * Single labelled row inside the profile info card.
 * @param icon   - Ionicons icon name.
 * @param label  - Muted label shown above the value.
 * @param value  - Primary value text.
 * @param noBorder - Omit the bottom separator when true.
 */
function InfoRow({
  icon,
  label,
  value,
  noBorder = false,
}: {
  icon: string;
  label: string;
  value: string;
  noBorder?: boolean;
}) {
  return (
    <View
      className="flex-row items-start py-3"
      style={noBorder ? undefined : { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
    >
      <Ionicons name={icon as any} size={18} color="#006A75" style={{ marginTop: 1 }} />
      <View className="ml-3 flex-1">
        <Text className="text-text-muted text-xs mb-0.5">{label}</Text>
        <Text className="text-text-primary text-sm font-medium">{value}</Text>
      </View>
    </View>
  );
}

/**
 * Skeleton placeholder shown while the backend profile is loading.
 */
function ProfileLoading() {
  return (
    <View className="mx-6 mt-5 bg-white rounded-2xl p-6 items-center">
      <ActivityIndicator size="small" color="#006A75" />
      <Text className="text-text-muted text-sm mt-2">Cargando información...</Text>
    </View>
  );
}

/**
 * Error state shown when the backend profile request fails.
 * @param message - Spanish-language error message.
 */
function ProfileError({ message }: { message: string }) {
  return (
    <View className="mx-6 mt-5 bg-red-50 rounded-2xl p-5">
      <Text className="text-red-600 text-sm text-center">{message}</Text>
    </View>
  );
}

/**
 * Academic info card populated from the backend user profile.
 * @param profile - Resolved UserProfile from the API.
 */
function ProfileInfoCard({ profile }: { profile: UserProfile }) {
  const formatCity = (city?: string | null) =>
    city ? city.charAt(0) + city.slice(1).toLowerCase() : null;

  const rows: Array<{ icon: string; label: string; value: string }> = [];

  if (profile.organizationName) {
    rows.push({
      icon: 'school-outline',
      label: 'Universidad / Institución',
      value:
        profile.organizationName.charAt(0) +
        profile.organizationName.slice(1).toLowerCase(),
    });
  }
  if (profile.academicProgram) {
    rows.push({
      icon: 'book-outline',
      label: 'Programa académico',
      value: profile.academicProgram,
    });
  }
  if (profile.currentSemester != null) {
    rows.push({
      icon: 'layers-outline',
      label: 'Semestre actual',
      value: `Semestre ${profile.currentSemester}`,
    });
  }
  if (profile.city) {
    rows.push({
      icon: 'location-outline',
      label: 'Ciudad',
      value: formatCity(profile.city) ?? profile.city,
    });
  }
  if (profile.country) {
    rows.push({ icon: 'flag-outline', label: 'País', value: profile.country });
  }

  if (rows.length === 0 && (!profile.interests || profile.interests.length === 0)) {
    return null;
  }

  return (
    <View className="mx-6 mt-5 bg-white rounded-2xl px-5">
      <Text className="text-text-muted text-xs font-semibold pt-5 pb-2 uppercase tracking-wide">
        Información académica
      </Text>

      {rows.map((row, idx) => (
        <InfoRow
          key={row.label}
          icon={row.icon}
          label={row.label}
          value={row.value}
          noBorder={idx === rows.length - 1 && (!profile.interests || profile.interests.length === 0)}
        />
      ))}

      {profile.interests && profile.interests.length > 0 && (
        <View className="py-3">
          <View className="flex-row items-center mb-2">
            <Ionicons name="star-outline" size={18} color="#006A75" />
            <Text className="text-text-muted text-xs mb-0.5" style={{ marginLeft: 12 }}>
              Intereses
            </Text>
          </View>
          <View className="flex-row flex-wrap" style={{ gap: 8, marginLeft: 30 }}>
            {profile.interests.map((interest) => (
              <View key={interest} className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs font-medium">{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Confirmation modal shown before executing logout.
 * @param visible   - Controls modal visibility.
 * @param onConfirm - Called when the user confirms logout.
 * @param onCancel  - Called when the user dismisses the modal.
 */
function LogoutModal({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
        onPress={onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ width: '100%' }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              width: '100%',
            }}
          >
            <Text
              style={{
                color: '#1A2E35',
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              ¿Cerrar sesión?
            </Text>
            <Text
              style={{
                color: '#64748B',
                fontSize: 14,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              Podrás ingresar con otra cuenta en cualquier momento.
            </Text>

            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#DC2626',
                borderRadius: 999,
                paddingVertical: 12,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>
                Sí, cerrar sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#F1F5F9',
                borderRadius: 999,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#1A2E35', fontWeight: '600', fontSize: 16 }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

/**
 * Profile screen shared by LEARNER and TUTOR tab groups.
 * Shows Clerk identity, backend profile data, and a logout action.
 */
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader
        right={
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0D2B22' }}>Mi perfil</Text>
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Identity card */}
        <View className="mx-6 mt-5 bg-white rounded-2xl p-6 items-center">
          <AvatarPlaceholder name={fullName} />
          <Text className="text-text-primary text-xl font-bold mt-4">{fullName}</Text>
          {email ? (
            <Text className="text-text-muted text-sm mt-1">{email}</Text>
          ) : null}
          {profile?.role ? (
            <View className="mt-3 bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-xs font-semibold">
                {profile.role === 'LEARNER' ? 'Aprendiz' : 'Tutor'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Academic info */}
        {profileLoading ? (
          <ProfileLoading />
        ) : profileError ? (
          <ProfileError message={profileError} />
        ) : profile ? (
          <ProfileInfoCard profile={profile} />
        ) : null}

        {/* Logout */}
        <View
          className="mx-6 mt-8 bg-white rounded-2xl"
          style={{ overflow: 'hidden' }}
        >
          <TouchableOpacity
            onPress={() => setConfirmVisible(true)}
            disabled={loggingOut}
            activeOpacity={0.7}
            className="flex-row items-center px-5 py-4"
            style={{ gap: 12 }}
          >
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            <Text className="text-red-600 text-base font-semibold flex-1">
              {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LogoutModal
        visible={confirmVisible}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}