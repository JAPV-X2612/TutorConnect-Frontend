import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ProximaSesion } from '../types';

interface ProximasSesionesProps {
  sesiones: ProximaSesion[];
  /** True when the tutor has completed at least one session (total_sesiones > 0). */
  hasActivity: boolean;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Formats an ISO 8601 UTC date string.
 * - Same day  → "Hoy, 15:00"
 * - Next day  → "Mañana, 18:30"
 * - Otherwise → "Dom 20 Abr · 15:00"
 */
function formatFecha(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (date.toDateString() === today.toDateString()) return `Hoy, ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Mañana, ${time}`;

  return `${DAYS_ES[date.getDay()]} ${date.getDate()} ${MONTHS_ES[date.getMonth()]} · ${time}`;
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

/** Returns up to 2 uppercase initials from a full name string. */
function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    : parts[0].charAt(0).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Vertical list of upcoming sessions (max 5, provided by the backend).
 * Dates display as "Hoy / Mañana / short date".
 * "Ver calendario" is a placeholder for the calendar screen (HU-12).
 * Session items are touchable as a placeholder for session detail (HU-13).
 */
export function ProximasSesiones({ sesiones, hasActivity }: ProximasSesionesProps) {
  return (
    <View className="mt-7 px-5 pb-8">
      {/* Section header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-extrabold text-text-primary">Próximas Sesiones</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text className="text-sm font-semibold text-primary">Ver calendario</Text>
        </TouchableOpacity>
      </View>

      {sesiones.length === 0 ? (
        <View
          className="bg-white rounded-2xl border border-border p-6 items-center"
          style={{ elevation: 1 }}
        >
          <Ionicons name="calendar-outline" size={36} color="#A0B0B8" />
          {hasActivity && (
            <Text className="text-sm text-text-muted text-center mt-3">
              No tienes sesiones agendadas próximamente
            </Text>
          )}
        </View>
      ) : (
        <>
          {sesiones.map((sesion, index) => {
            const initials = getInitials(sesion.aprendiz_nombre);
            const isLast = index === sesiones.length - 1;
            const fecha = formatFecha(sesion.fecha);

            return (
              <TouchableOpacity
                key={sesion.id}
                activeOpacity={0.7}
                className={`flex-row items-center py-3.5 ${!isLast ? 'border-b border-border' : ''}`}
              >
                {/* Avatar — teal-light bg matching reference design */}
                <View
                  className="items-center justify-center mr-3.5 flex-shrink-0"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#E8F5F3',
                  }}
                >
                  <Text className="text-base font-bold text-primary">{initials}</Text>
                </View>

                {/* Info */}
                <View className="flex-1 min-w-0">
                  <Text
                    className="text-sm font-bold text-text-primary mb-0.5"
                    numberOfLines={1}
                  >
                    {sesion.aprendiz_nombre}
                  </Text>
                  <Text className="text-xs font-semibold text-primary mb-0.5">{fecha}</Text>
                  <Text className="text-xs text-text-muted" numberOfLines={1}>
                    {sesion.materia ?? 'Sin materia'}
                  </Text>
                </View>

                {/* Chevron */}
                <Text style={{ fontSize: 24, color: '#A0B0B8', paddingLeft: 8 }}>›</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </View>
  );
}
