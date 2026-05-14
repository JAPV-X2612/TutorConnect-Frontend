/**
 * Mock payment gateway screen for learners.
 *
 * Calls GET /payments/bookings/:id/summary on mount to start the 10-minute
 * slot-hold timer. On submit, posts card data to POST /payments/bookings/:id/pay.
 *
 * Test cards:
 *   4111 1111 1111 1111 → CONFIRMED
 *   4000 0000 0000 0002 → REJECTED (fondos insuficientes)
 *   Any card failing Luhn → rejected client-side
 *
 * @author TutorConnect Team
 */

import { usePayment } from '@/hooks/use-payment';
import { usePaymentSummary } from '@/hooks/use-payment-summary';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return (digits.match(/.{1,4}/g) ?? []).join(' ');
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function validateForm(
  cardNumber: string,
  name: string,
  expiry: string,
  cvv: string,
): string | null {
  const digits = cardNumber.replace(/\s/g, '');
  if (digits.length < 16) return 'El número de tarjeta debe tener 16 dígitos.';
  if (!luhnCheck(digits)) return 'Número de tarjeta inválido.';
  if (!name.trim()) return 'Ingresa el nombre del titular.';
  const parts = expiry.split('/');
  const month = parseInt(parts[0] ?? '', 10);
  const year = 2000 + parseInt(parts[1] ?? '0', 10);
  const now = new Date();
  if (isNaN(month) || month < 1 || month > 12) return 'Fecha de vencimiento inválida.';
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return 'La tarjeta ha vencido.';
  }
  if (cvv.length < 3) return 'CVV inválido.';
  return null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <Text className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">
      {text}
    </Text>
  );
}

function BreakdownRow({
  label,
  sub,
  value,
  bold,
}: {
  label: string;
  sub?: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-start">
      <View className="flex-1 mr-4">
        <Text className={`text-sm ${bold ? 'text-text-primary font-bold' : 'text-text-muted'}`}>
          {label}
        </Text>
        {sub && <Text className="text-text-muted text-sm">{sub}</Text>}
      </View>
      <Text className={`text-sm ${bold ? 'text-primary font-bold text-base' : 'text-text-muted'}`}>
        {value}
      </Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const router = useRouter();
  const {
    bookingId,
    subject: paramSubject,
    tutorName: paramTutorName,
    price: paramPrice,
    duration: paramDuration,
    scheduledAt: paramScheduledAt,
    timeRange: paramTimeRange,
  } = useLocalSearchParams<{
    bookingId: string;
    subject: string;
    tutorName: string;
    price: string;
    duration: string;
    scheduledAt: string;
    timeRange: string;
  }>();

  // Fetching summary starts the 10-min backend timer.
  const { summary, loading: summaryLoading } = usePaymentSummary(bookingId ?? '');
  const { processPayment, loading: paying } = usePayment();

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Use summary data when available, fall back to navigation params while loading.
  const subject = summary?.subject ?? paramSubject ?? '';
  const tutorName = summary?.tutorName ?? paramTutorName ?? '';
  const grossAmount = summary?.grossAmount ?? parseInt(paramPrice ?? '0', 10);
  const commission = summary?.commissionAmount ?? Math.round(grossAmount * 0.15);
  const tutorNet = summary?.netAmount ?? grossAmount - commission;
  const duration = summary?.duration ?? parseInt(paramDuration ?? '0', 10);
  const timeRange = summary?.timeRange ?? paramTimeRange ?? '';

  const rawDate = summary?.scheduledAt ?? paramScheduledAt;
  const scheduledLabel = rawDate
    ? new Date(rawDate).toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : '';

  const handlePay = async () => {
    const validationError = validateForm(cardNumber, cardName, expiry, cvv);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);

    const [mm, yy] = expiry.split('/');
    const fullYear = yy ? String(2000 + parseInt(yy, 10)) : '';
    const { data: result, error } = await processPayment(bookingId ?? '', {
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardholderName: cardName.trim(),
      expiryMonth: mm ?? '',
      expiryYear: fullYear,
      cvv,
    });

    if (error || !result) {
      setFormError(error ?? 'Error al procesar el pago. Inténtalo de nuevo.');
      return;
    }

    if (result.status === 'REJECTED') {
      setFormError(
        `Pago rechazado: ${result.rejectionReason ?? 'fondos insuficientes o tarjeta inválida'}. ` +
          'Verifica los datos e intenta de nuevo.',
      );
      return;
    }

    router.replace({
      pathname: '/(learner)/payment/success' as any,
      params: {
        transactionId: result.transactionId,
        subject,
        tutorName,
        scheduledLabel,
        timeRange,
        amount: String(grossAmount),
      },
    });
  };

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
        <Text className="text-base font-semibold text-text-primary flex-1">Pago seguro</Text>
        <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Session summary */}
          <View className="mx-6 mt-5 mb-4 bg-white border border-border rounded-2xl p-4">
            <SectionLabel text="Resumen de la sesión" />
            {summaryLoading ? (
              <ActivityIndicator color="#006A75" style={{ marginVertical: 8 }} />
            ) : (
              <>
                <Text className="text-text-primary font-bold text-base mb-0.5">{subject}</Text>
                <Text className="text-text-muted text-sm mb-3">{tutorName}</Text>
                <View className="flex-row flex-wrap gap-3 pt-3 border-t border-border">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="calendar-outline" size={14} color="#006A75" />
                    <Text className="text-text-muted text-sm capitalize">{scheduledLabel}</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="time-outline" size={14} color="#006A75" />
                    <Text className="text-text-muted text-sm">{timeRange}</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="hourglass-outline" size={14} color="#006A75" />
                    <Text className="text-text-muted text-sm">{duration} min</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Payment breakdown */}
          <View className="mx-6 mb-5 bg-white border border-border rounded-2xl p-4">
            <SectionLabel text="Detalle del pago" />
            <View className="gap-2.5">
              <BreakdownRow
                label="Valor de la sesión"
                value={COP.format(grossAmount)}
              />
              <BreakdownRow
                label="Comisión TutorConnect"
                sub="15% de la sesión"
                value={COP.format(commission)}
              />
              <BreakdownRow label="Tutor recibe" value={COP.format(tutorNet)} />
              <View className="pt-3 mt-1 border-t border-border">
                <BreakdownRow
                  label="Total a pagar"
                  value={COP.format(grossAmount)}
                  bold
                />
              </View>
            </View>
          </View>

          {/* Card form */}
          <View className="mx-6 mb-4">
            <SectionLabel text="Datos de tarjeta" />

            <View className="mb-3">
              <Text className="text-sm text-text-muted font-semibold mb-1.5">
                Número de tarjeta
              </Text>
              <View className="flex-row items-center bg-white border border-border rounded-xl px-4 py-3.5 gap-2">
                <MaterialCommunityIcons name="credit-card-outline" size={18} color="#64748B" />
                <TextInput
                  className="flex-1 text-text-primary text-sm"
                  placeholder="4111 1111 1111 1111"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                  accessibilityLabel="Número de tarjeta"
                />
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-text-muted font-semibold mb-1.5">
                Nombre del titular
              </Text>
              <TextInput
                className="bg-white border border-border rounded-xl px-4 py-3.5 text-text-primary text-sm"
                placeholder="Como aparece en la tarjeta"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="words"
                value={cardName}
                onChangeText={setCardName}
                accessibilityLabel="Nombre del titular"
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm text-text-muted font-semibold mb-1.5">Vencimiento</Text>
                <TextInput
                  className="bg-white border border-border rounded-xl px-4 py-3.5 text-text-primary text-sm"
                  placeholder="MM/AA"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  maxLength={5}
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  accessibilityLabel="Fecha de vencimiento"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-muted font-semibold mb-1.5">CVV</Text>
                <TextInput
                  className="bg-white border border-border rounded-xl px-4 py-3.5 text-text-primary text-sm"
                  placeholder="123"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 3))}
                  accessibilityLabel="CVV"
                />
              </View>
            </View>
          </View>

          {formError && (
            <View className="mx-6 mb-2 flex-row items-start gap-2 bg-red-50 rounded-xl px-4 py-3">
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text className="text-red-700 text-sm flex-1 leading-5">{formError}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-background border-t border-border">
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={paying || summaryLoading}
          className={`rounded-full py-4 items-center mb-3 ${paying || summaryLoading ? 'bg-gray-200' : 'bg-primary'}`}
          onPress={handlePay}
          accessibilityLabel="Confirmar y pagar"
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              Confirmar y pagar — {COP.format(grossAmount)}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          className="items-center py-1"
          accessibilityLabel="Cancelar pago"
        >
          <Text className="text-text-muted text-sm">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
