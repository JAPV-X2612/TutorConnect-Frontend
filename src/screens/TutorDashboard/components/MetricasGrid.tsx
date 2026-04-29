/**
 * @file MetricasGrid.tsx
 * @description Metric stat cards for the tutor dashboard — sessions, earnings, rating.
 * @author TutorConnect Team
 */

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

// ─── Design tokens (matching reference) ──────────────────────────────────────

const C = {
  primary: '#006A75',
  dark: '#0D2B22',
  muted: '#6B8C82',
  cardBg: '#FFFFFF',
  border: 'rgba(107, 140, 130, 0.2)',
  star: '#F5A623',
  starEmpty: '#CBD5E1',
};

const cardStyle = {
  backgroundColor: C.cardBg,
  borderRadius: 16,
  paddingVertical: 18,
  paddingHorizontal: 20,
  borderWidth: 0.5,
  borderColor: C.border,
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** "2026-04" → "Abril 2026" */
function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split('-');
  const name = MONTH_NAMES[parseInt(month, 10) - 1];
  return name ? `${name} ${year}` : periodo;
}

/** 480000 → "$480.000" */
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

/** Three pulsing card placeholders shown while data loads. */
export function MetricasSkeleton() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const Bar = ({ w, h }: { w: number; h: number }) => (
    <Animated.View
      style={[anim, { width: w, height: h, backgroundColor: '#D1E8E2', borderRadius: 6 }]}
    />
  );

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 8, gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[cardStyle, { gap: 10 }]}>
          <Bar w={120} h={11} />
          <Bar w={90} h={32} />
          <Bar w={80} h={11} />
        </View>
      ))}
    </View>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  change: string;
}

function StatCard({ icon, label, value, change }: StatCardProps) {
  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Ionicons name={icon} size={14} color={C.primary} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.8,
            color: C.primary,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{ fontSize: 32, fontWeight: '700', color: C.dark, marginBottom: 4, lineHeight: 38 }}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 13, color: C.primary, fontWeight: '500' }}>{change}</Text>
    </View>
  );
}

// ─── Rating card ──────────────────────────────────────────────────────────────

function RatingCard({ rating, totalResenas }: { rating: number | null; totalResenas: number }) {
  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Ionicons name="star-outline" size={14} color={C.primary} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.8,
            color: C.primary,
            textTransform: 'uppercase',
          }}
        >
          Calificación Media
        </Text>
      </View>

      {rating !== null ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: C.dark, lineHeight: 38 }}>
              {rating.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 16, color: C.muted, fontWeight: '500' }}>/ 5</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 2, marginBottom: totalResenas > 0 ? 4 : 0 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Text
                key={s}
                style={{ fontSize: 18, color: s <= Math.floor(rating) ? C.star : C.starEmpty }}
              >
                ★
              </Text>
            ))}
          </View>
          {totalResenas > 0 && (
            <Text style={{ fontSize: 12, color: C.muted }}>
              {totalResenas} reseña{totalResenas !== 1 ? 's' : ''}
            </Text>
          )}
        </>
      ) : (
        <Text style={{ fontSize: 18, fontWeight: '600', color: C.muted }}>Sin reseñas aún</Text>
      )}
    </View>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

/**
 * Vertical stack of three metric cards: total sessions, gross earnings (COP),
 * and average rating with star row.
 *
 * @param metricas - Dashboard metrics from the backend.
 */
export function MetricasGrid({ metricas }: { metricas: TutorMetricas }) {
  const { total_sesiones, ingresos_totales, calificacion_promedio, total_resenas, periodo } =
    metricas;
  const periodoLabel = formatPeriodo(periodo);

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 8, gap: 12 }}>
      <StatCard
        icon="calendar-outline"
        label="Sesiones Totales"
        value={String(total_sesiones)}
        change={periodoLabel}
      />
      <StatCard
        icon="card-outline"
        label="Ganancias"
        value={formatCOP(ingresos_totales)}
        change={periodoLabel}
      />
      <RatingCard rating={calificacion_promedio} totalResenas={total_resenas} />
    </View>
  );
}
