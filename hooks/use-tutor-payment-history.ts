/**
 * Hook for fetching a tutor's payment history and monthly earnings summary.
 *
 * @author TutorConnect Team
 */

import { useEffect, useState } from 'react';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export interface PaymentRecord {
  paymentId: number;
  bookingId: string;
  learnerName: string;
  subject: string;
  sessionDate: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  receiptNumber: string;
  paidAt: string;
  currency: string;
}

export interface PeriodSummary {
  totalSessions: number;
  grossRevenue: number;
  totalCommission: number;
  netRevenue: number;
  currency: string;
}

export interface TutorPaymentHistory {
  period: { from: string; to: string };
  monthlySummary: PeriodSummary;
  filterSummary: PeriodSummary;
  history: PaymentRecord[];
}

/**
 * Fetches payment history records and period summary for the authenticated tutor.
 *
 * @param from - ISO date string `YYYY-MM-DD` for range start (optional).
 * @param to   - ISO date string `YYYY-MM-DD` for range end (optional).
 * @returns `{ data, loading, error, refetch }`
 */
export function useTutorPaymentHistory(from?: string, to?: string) {
  const { get } = useApiRequest();
  const [data, setData] = useState<TutorPaymentHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    get<TutorPaymentHistory>(API_ENDPOINTS.tutorPaymentHistory(from, to)).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        setError('No se pudo cargar el historial de pagos.');
      } else {
setData(res.data);
        setError(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [from, to, revision]);

  return { data, loading, error, refetch: () => setRevision((n) => n + 1) };
}
