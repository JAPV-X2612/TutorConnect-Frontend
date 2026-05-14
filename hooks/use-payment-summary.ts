/**
 * Hook that fetches the payment summary for a booking and starts the
 * 10-minute slot reservation timer on the backend.
 *
 * Must be called on mount of the payment screen. If the user leaves before
 * completing payment, the backend cancels the booking automatically after the
 * timer expires.
 *
 * @author TutorConnect Team
 */

import { useEffect, useState } from 'react';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export interface BookingPaymentSummary {
  subject: string;
  tutorName: string;
  scheduledAt: string;
  duration: number;
  timeRange: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  /** ISO timestamp when the 10-min hold expires. */
  expiresAt: string;
}

/**
 * Fetches `GET /payments/bookings/:id/summary`, which also starts the backend
 * 10-minute cancellation timer.
 *
 * @param bookingId - UUID of the booking to pay for.
 * @returns `{ summary, loading, error }`
 */
export function usePaymentSummary(bookingId: string) {
  const { get } = useApiRequest();
  const [summary, setSummary] = useState<BookingPaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    setLoading(true);
    get<BookingPaymentSummary>(API_ENDPOINTS.paymentSummary(bookingId)).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        setError('No se pudo cargar el resumen de la reserva.');
      } else {
        setSummary(res.data);
        setError(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return { summary, loading, error };
}
