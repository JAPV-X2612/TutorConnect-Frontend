/**
 * Payment success screen shown after a confirmed simulated payment.
 *
 * Displays a receipt with the transaction ID, session details, and amount paid.
 *
 * @author TutorConnect Team
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2.5 border-b border-border">
      <Text className="text-text-muted text-sm">{label}</Text>
      <Text className="text-text-primary text-sm font-medium flex-1 text-right" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { transactionId, subject, tutorName, scheduledLabel, timeRange, amount } =
    useLocalSearchParams<{
      transactionId: string;
      subject: string;
      tutorName: string;
      scheduledLabel: string;
      timeRange: string;
      amount: string;
    }>();

  const amountValue = parseInt(amount ?? '0', 10);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success icon */}
        <View className="items-center mt-12 mb-8">
          <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-5">
            <Ionicons name="checkmark-circle" size={56} color="#16a34a" />
          </View>
          <Text className="text-2xl font-bold text-text-primary text-center mb-2">
            ¡Pago exitoso!
          </Text>
          <Text className="text-text-muted text-sm text-center leading-6">
            Tu sesión ha sido confirmada.{'\n'}El tutor ha sido notificado.
          </Text>
        </View>

        {/* Receipt card */}
        <View className="bg-white border border-border rounded-2xl p-5 mb-6">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="receipt-outline" size={18} color="#006A75" />
            <Text className="text-text-primary font-bold text-sm">Comprobante de pago</Text>
          </View>

          <ReceiptRow
            label="ID de transacción"
            value={transactionId ?? '—'}
          />
          <ReceiptRow label="Materia" value={subject ?? '—'} />
          <ReceiptRow label="Tutor" value={tutorName ?? '—'} />
          <ReceiptRow label="Fecha" value={scheduledLabel ?? '—'} />
          <ReceiptRow label="Horario" value={timeRange ?? '—'} />

          <View className="flex-row justify-between items-center pt-3 mt-1">
            <Text className="text-text-primary font-bold">Total pagado</Text>
            <Text className="text-primary font-bold text-lg">{COP.format(amountValue)}</Text>
          </View>
        </View>

        {/* Status badge */}
        <View className="flex-row items-center justify-center gap-2 mb-8">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-green-700 text-sm font-semibold">Sesión confirmada</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => router.replace('/(learner)/sessions' as any)}
          activeOpacity={0.85}
          className="bg-primary rounded-full py-4 items-center mb-3"
          accessibilityLabel="Ver mis sesiones"
        >
          <Text className="text-white font-bold text-base">Ver mis sesiones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace('/(learner)/dashboard' as any)}
          className="items-center py-2"
          accessibilityLabel="Volver al inicio"
        >
          <Text className="text-text-muted text-sm">Volver al inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
