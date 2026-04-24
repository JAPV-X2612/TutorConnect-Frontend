import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { TutorMetricas } from '../types';

interface MetricasGridProps {
  metricas: TutorMetricas;
  proximasCount: number;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Converts "2026-04" → "Abril 2026". */
function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split('-');
  const name = MONTH_NAMES[parseInt(month, 10) - 1];
  return name ? `${name} ${year}` : periodo;
}

/** Formats an integer as Colombian peso: 480000 → "$480.000 COP". */
function formatCOP(amount: number): string {
  try {
    return amount.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  } catch {
    return `$${amount.toLocaleString()} COP`;
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/** Four full-width pulsing card placeholders shown while data loads. */
export function MetricasSkeleton() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const Bar = ({ w }: { w: string }) => (
    <Animated.View style={animStyle} className={`bg-gray-200 rounded-lg ${w}`} />
  );

  return (
    <View className="px-5 mt-4 gap-3.5">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} className="bg-white rounded-2xl p-5 border border-border gap-3" style={{ elevation: 2 }}>
          <Bar w="h-3 w-32" />
          <Bar w="h-10 w-24" />
          <Bar w="h-3 w-20" />
        </View>
      ))}
    </View>
  );
}

// ─── Standard stat card ───────────────────────────────────────────────────────

interface StatCardProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  badge?: string;
}

function StatCard({ iconName, label, value, badge }: StatCardProps) {
  return (
    <View className="bg-white rounded-2xl p-5 border border-border" style={{ elevation: 2 }}>
      <View className="flex-row items-center gap-1.5 mb-3">
        <Ionicons name={iconName} size={15} color="#006A75" />
        <Text className="text-xs font-bold text-primary uppercase tracking-widest">{label}</Text>
      </View>
      <Text
        className="text-5xl font-extrabold text-text-primary mb-1"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {value}
      </Text>
      {badge ? <Text className="text-sm font-medium text-green-600">{badge}</Text> : null}
    </View>
  );
}

// ─── Rating card ──────────────────────────────────────────────────────────────

interface RatingCardProps {
  rating: number | null;
  totalResenas: number;
}

function RatingCard({ rating, totalResenas }: RatingCardProps) {
  return (
    <View className="bg-white rounded-2xl p-5 border border-border" style={{ elevation: 2 }}>
      <View className="flex-row items-center gap-1.5 mb-3">
        <Ionicons name="star-outline" size={15} color="#006A75" />
        <Text className="text-xs font-bold text-primary uppercase tracking-widest">
          Calificación Media
        </Text>
      </View>

      {rating !== null ? (
        <>
          <View className="flex-row items-end gap-1 mb-2">
            <Text className="text-5xl font-extrabold text-text-primary">
              {rating.toFixed(1)}
            </Text>
            <Text className="text-xl text-text-muted mb-2"> / 5</Text>
          </View>
          <View className="flex-row gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Text
                key={s}
                style={{ fontSize: 22, color: s <= Math.floor(rating) ? '#F4A923' : '#CBD5E1' }}
              >
                ★
              </Text>
            ))}
          </View>
          {totalResenas > 0 && (
            <Text className="text-xs text-text-muted mt-1">
              {totalResenas} reseña{totalResenas !== 1 ? 's' : ''}
            </Text>
          )}
        </>
      ) : (
        <Text className="text-xl font-semibold text-text-muted">Sin reseñas aún</Text>
      )}
    </View>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

/**
 * Vertical stack of four metric cards: total sessions, gross earnings (COP),
 * average rating with star row, and upcoming session count.
 * `metricas.periodo` ("YYYY-MM") is formatted as "Abril 2026" for display.
 */
export function MetricasGrid({ metricas, proximasCount }: MetricasGridProps) {
  const { total_sesiones, ingresos_totales, calificacion_promedio, total_resenas, periodo } =
    metricas;
  const periodoLabel = formatPeriodo(periodo);

  return (
    <View className="px-5 mt-4 gap-3.5">
      <StatCard
        iconName="checkmark-circle-outline"
        label="Sesiones Totales"
        value={String(total_sesiones)}
        badge={periodoLabel}
      />
      <StatCard
        iconName="cash-outline"
        label="Ganancias"
        value={formatCOP(ingresos_totales)}
        badge={periodoLabel}
      />
      <RatingCard rating={calificacion_promedio} totalResenas={total_resenas} />
      <StatCard
        iconName="time-outline"
        label="Próximas Sesiones"
        value={String(proximasCount)}
        badge={proximasCount > 0 ? `${proximasCount} agendada${proximasCount !== 1 ? 's' : ''}` : undefined}
      />
    </View>
  );
}
