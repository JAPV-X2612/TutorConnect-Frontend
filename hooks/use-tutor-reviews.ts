/**
 * Hook for fetching the authenticated tutor's aggregate review summary.
 *
 * @author TutorConnect Team
 */

import { useEffect, useState, useCallback } from 'react';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export interface RecentReview {
  id: number;
  rating: number;
  comment: string;
  learnerName: string;
  subject: string;
  createdAt: string;
}

export interface TutorReviewsSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  recentReviews: RecentReview[];
}

/**
 * Fetches `GET /reviews/tutor/summary` for the authenticated tutor.
 *
 * @returns `{ data, loading, error }`
 */
export function useTutorReviews() {
  const { get } = useApiRequest();
  const [data, setData] = useState<TutorReviewsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    get<TutorReviewsSummary>(API_ENDPOINTS.tutorReviewsSummary).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        setError('No se pudieron cargar las reseñas.');
      } else {
        setData(res.data);
        setError(null);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [revision]);

  const refetch = useCallback(() => setRevision((n) => n + 1), []);

  return { data, loading, error, refetch };
}
