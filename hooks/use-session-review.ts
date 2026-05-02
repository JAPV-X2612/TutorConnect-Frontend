import { useCallback, useState } from 'react';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

/**
 * Shape of a review record as returned by the backend.
 *
 * @author TutorConnect Team
 */
export interface SessionReview {
  id: number;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface UseSessionReviewState {
  existingReview: SessionReview | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

interface UseSessionReviewActions {
  fetchExisting: () => Promise<void>;
  submit: (
    rating: number,
    comment?: string,
  ) => Promise<{ success: boolean }>;
  reset: () => void;
}

/**
 * Encapsulates the network state and actions for the session-rating feature
 * scoped to a single booking. Used by RateSessionModal.
 *
 * @param bookingId UUID of the booking the learner is reviewing. When null,
 *                  fetch and submit are no-ops (lets the hook be mounted
 *                  before the user picks a session).
 *
 * @author TutorConnect Team
 */
export function useSessionReview(
  bookingId: string | null,
): UseSessionReviewState & UseSessionReviewActions {
  const api = useApiRequest();
  const [existingReview, setExistingReview] = useState<SessionReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExisting = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);

    const res = await api.get<SessionReview | null>(
      API_ENDPOINTS.reviewByBooking(bookingId),
    );

    if (res.error) {
      setError(res.error);
      setExistingReview(null);
    } else {
      // The backend responds 200 with an empty body when no review exists,
      // which the shared api wrapper deserialises as a Blob. Validate the
      // shape before treating the payload as a SessionReview.
      const data = res.data as unknown;
      const isReview =
        data !== null &&
        typeof data === 'object' &&
        typeof (data as { rating?: unknown }).rating === 'number';
      setExistingReview(isReview ? (data as SessionReview) : null);
    }
    setLoading(false);
  }, [bookingId]);

  const submit = useCallback(
    async (rating: number, comment?: string) => {
      if (!bookingId) return { success: false };

      setSubmitting(true);
      setError(null);

      const trimmed = comment?.trim();
      const payload = {
        bookingId,
        rating,
        ...(trimmed ? { comment: trimmed } : {}),
      };

      const res = await api.post<SessionReview>(API_ENDPOINTS.reviews, payload);
      setSubmitting(false);

      if (res.error || !res.data) {
        setError(res.error ?? 'No se pudo enviar la calificación');
        return { success: false };
      }

      setExistingReview(res.data);
      return { success: true };
    },
    [bookingId],
  );

  const reset = useCallback(() => {
    setExistingReview(null);
    setError(null);
    setLoading(false);
    setSubmitting(false);
  }, []);

  return {
    existingReview,
    loading,
    submitting,
    error,
    fetchExisting,
    submit,
    reset,
  };
}
