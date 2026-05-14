/**
 * Tutor payment history screen.
 *
 * Shows confirmed session payments with gross amount, TutorConnect commission (15%),
 * and net earnings. Includes date-range filtering and a monthly summary header.
 *
 * @author TutorConnect Team
 */

import { useTutorPaymentHistory } from '@/hooks/use-tutor-payment-history';
import type { PaymentRecord } from '@/hooks/use-tutor-payment-history';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// ── Date range helpers ────────────────────────────────────────────────────────

type FilterKey = 'this_month' | 'last_month' | 'last_3_months';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'this_month', label: 'Este mes' },
  { key: 'last_month', label: 'Mes pasado' },
  { key: 'last_3_months', label: 'Últimos 3 meses' },
];

function buildDateRange(key: FilterKey): { from: string; to: string } {
  const now = new Date();
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  let start: Date;

  if (key === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (key === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  }

  return {
    from: start.toISOString().split('T')[0]!,
    to: end.toISOString().split('T')[0]!,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  totalSessions,
  grossRevenue,
  totalCommission,
  netRevenue,
}: {
  totalSessions: number;
  grossRevenue: number;
  totalCommission: number;
  netRevenue: number;
}) {
  return (
    <View className="mx-6 mb-5 bg-primary rounded-2xl p-5">
      <Text className="text-white text-3xl font-bold mb-1">{COP.format(netRevenue)}</Text>
      <Text className="text-white/60 text-sm mb-4">Ingresos netos del período</Text>
      <View className="flex-row gap-0 pt-4 border-t border-white/20">
        <View className="flex-1">
          <Text className="text-white/60 text-sm mb-0.5">Sesiones</Text>
          <Text className="text-white font-semibold text-base">{totalSessions}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white/60 text-sm mb-0.5">Bruto</Text>
          <Text className="text-white font-semibold text-base">{COP.format(grossRevenue)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white/60 text-sm mb-0.5">Comisión</Text>
          <Text className="text-white font-semibold text-base">{COP.format(totalCommission)}</Text>
        </View>
      </View>
    </View>
  );
}

function PaymentCard({ record }: { record: PaymentRecord }) {
  const date = new Date(record.sessionDate).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <View className="bg-white border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-base">{record.subject}</Text>
          <Text className="text-text-muted text-sm mt-0.5">{record.learnerName}</Text>
        </View>
        <View className="bg-green-50 rounded-xl px-2.5 py-1">
          <Text className="text-green-700 text-xs font-semibold">Pagado</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1.5 mb-3">
        <Ionicons name="calendar-outline" size={14} color="#64748B" />
        <Text className="text-text-muted text-sm capitalize">{date}</Text>
        <Text className="text-text-muted text-sm">· {record.receiptNumber}</Text>
      </View>

      <View className="pt-3 border-t border-border gap-1.5">
        <View className="flex-row justify-between">
          <Text className="text-text-muted text-sm">Valor bruto</Text>
          <Text className="text-text-muted text-sm">{COP.format(record.grossAmount)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-text-muted text-sm">
            Comisión TutorConnect ({Math.round(record.commissionRate * 100)}%)
          </Text>
          <Text className="text-text-muted text-sm">−{COP.format(record.commissionAmount)}</Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-text-primary font-semibold text-base">Tú recibes</Text>
          <Text className="text-primary font-bold text-base">{COP.format(record.netAmount)}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('this_month');
  const listRef = useRef<FlatList>(null);

  const { from, to } = useMemo(() => buildDateRange(activeFilter), [activeFilter]);
  const { data, loading, error, refetch } = useTutorPaymentHistory(from, to);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top bar */}
      <View className="flex-row items-center px-4 py-2 border-b border-border gap-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary flex-1">Historial de pagos</Text>
      </View>

      {/* Fixed header: summary card + filter pills */}
      <View className="mt-5">
        {data?.filterSummary ? (
          <SummaryCard {...data.filterSummary} />
        ) : loading ? (
          <View className="mx-6 mb-5 h-36 bg-primary/10 rounded-2xl items-center justify-center">
            <ActivityIndicator color="#006A75" />
          </View>
        ) : null}
      </View>

      <View className="flex-row px-6 gap-2 mb-4">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => {
              setActiveFilter(f.key);
              listRef.current?.scrollToOffset({ offset: 0, animated: false });
            }}
            activeOpacity={0.8}
            accessibilityLabel={f.label}
            className={`flex-1 rounded-full py-2 items-center border ${
              activeFilter === f.key
                ? 'bg-primary border-primary'
                : 'bg-white border-border'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeFilter === f.key ? 'text-white' : 'text-text-muted'
              }`}
              numberOfLines={1}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable sessions list */}
      <FlatList
        ref={listRef}
        data={data?.history ?? []}
        keyExtractor={(item) => String(item.paymentId)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <View className="px-6 mb-3">
              <Text className="text-text-primary font-semibold text-base">
                Sesiones confirmadas
              </Text>
            </View>

            {error && (
              <View className="mx-6 mb-4 bg-red-50 rounded-2xl p-5 items-center">
                <Ionicons name="alert-circle-outline" size={28} color="#DC2626" />
                <Text className="text-red-700 text-sm text-center mt-2">{error}</Text>
                <TouchableOpacity
                  onPress={refetch}
                  className="mt-3 bg-red-600 rounded-full px-5 py-2"
                  accessibilityLabel="Reintentar"
                >
                  <Text className="text-white text-sm font-semibold">Reintentar</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View className="px-6">
            <PaymentCard record={item} />
          </View>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <View className="mx-6 bg-white border border-dashed border-border rounded-2xl p-8 items-center">
              <Ionicons name="wallet-outline" size={36} color="#CBD5E1" />
              <Text className="text-text-muted text-sm text-center mt-3 leading-5">
                No hay sesiones pagadas{'\n'}en este período.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
