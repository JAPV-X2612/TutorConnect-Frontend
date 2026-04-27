/**
 * @file ProximasSesiones.tsx
 * @description Upcoming sessions list for the tutor dashboard.
 * @author TutorConnect Team
 */

import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ProximaSesion } from '../types';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  primary: '#006A75',
  dark: '#0D2B22',
  muted: '#6B8C82',
  timeToday: '#006A75',
  timeFuture: '#888780',
  avatarBg: '#D0E8EA',
  avatarText: '#004d57',
  border: 'rgba(107, 140, 130, 0.2)',
  chevron: '#B4B2A9',
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Formats an ISO date string relative to today.
 * Returns `{ label, isToday }` so the caller can style the time accordingly.
 */
function formatFecha(iso: string): { label: string; isToday: boolean } {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (date.toDateString() === today.toDateString()) {
    return { label: `Hoy, ${time}`, isToday: true };
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return { label: `Mañana, ${time}`, isToday: false };
  }
  return {
    label: `${DAYS_ES[date.getDay()]} ${date.getDate()} ${MONTHS_ES[date.getMonth()]} · ${time}`,
    isToday: false,
  };
}

/** Returns up to 2 uppercase initials from a full name. */
function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProximasSesionesProps {
  sesiones: ProximaSesion[];
  /** True when the tutor has completed at least one session (total_sesiones > 0). */
  hasActivity: boolean;
}

/**
 * Section with "Próximas Sesiones" header and a vertical list of session rows.
 * Empty state is shown when no sessions are scheduled.
 * "Ver calendario" is a placeholder for the calendar screen (HU-12).
 */
export function ProximasSesiones({ sesiones, hasActivity }: ProximasSesionesProps) {
  return (
    <View style={{ marginTop: 20, paddingBottom: 32 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 12,
          paddingTop: 8,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: C.dark }}>Próximas Sesiones</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary }}>Ver calendario</Text>
        </TouchableOpacity>
      </View>

      {/* Session rows */}
      {sesiones.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 0.5,
              borderColor: C.border,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Ionicons name="calendar-outline" size={36} color="#A0B0B8" />
            {hasActivity && (
              <Text style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 12 }}>
                No tienes sesiones agendadas próximamente
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          {sesiones.map((sesion, index) => {
            const initials = getInitials(sesion.aprendiz_nombre);
            const isLast = index === sesiones.length - 1;
            const { label: fechaLabel, isToday } = formatFecha(sesion.fecha);

            return (
              <TouchableOpacity
                key={sesion.id}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  borderBottomWidth: isLast ? 0 : 0.5,
                  borderBottomColor: C.border,
                }}
              >
                {/* Avatar */}
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: C.avatarBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: C.avatarText }}>
                    {initials}
                  </Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: '600', color: C.dark, marginBottom: 2 }}
                    numberOfLines={1}
                  >
                    {sesion.aprendiz_nombre}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isToday ? C.timeToday : C.timeFuture,
                      marginBottom: 2,
                    }}
                  >
                    {fechaLabel}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>
                    {sesion.materia ?? 'Sin materia'}
                  </Text>
                </View>

                {/* Chevron */}
                <Text style={{ fontSize: 22, color: C.chevron }}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
