/**
 * Hook for processing simulated payments through the mock payment gateway.
 *
 * The booking ID goes in the URL (`POST /payments/bookings/:id/pay`); card data
 * goes in the request body.
 *
 * @author TutorConnect Team
 */

import { useState } from 'react';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export interface PaymentPayload {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface PaymentResult {
  transactionId: string;
  status: 'CONFIRMED' | 'REJECTED';
  amount: number;
  rejectionReason?: string;
}

/**
 * Submits a payment to the mock gateway for a specific booking.
 *
 * @returns `{ processPayment, loading }`
 * @example
 * const { processPayment, loading } = usePayment();
 * const result = await processPayment(bookingId, { cardNumber, ... });
 */
export function usePayment() {
  const { post } = useApiRequest();
  const [loading, setLoading] = useState(false);

  const processPayment = async (
    bookingId: string,
    payload: PaymentPayload,
  ): Promise<{ data?: PaymentResult; error?: string }> => {
    setLoading(true);
    const res = await post<PaymentResult>(API_ENDPOINTS.processPayment(bookingId), payload);
    setLoading(false);
    if (res.error || !res.data) {
      return { error: res.error ?? 'Error al procesar el pago.' };
    }
    return { data: res.data };
  };

  return { processPayment, loading };
}
