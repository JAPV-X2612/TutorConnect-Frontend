import { useCallback, useEffect, useState } from 'react';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { TutorDashboardData } from '@/src/screens/TutorDashboard/types';

interface UseTutorDashboardResult {
  data: TutorDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches tutor dashboard data from GET /dashboard/tutor.
 * Exposes reactive state and an imperative refetch trigger.
 *
 * @returns `{ data, isLoading, error, refetch }`
 */
export function useTutorDashboard(): UseTutorDashboardResult {
  const { get } = useApiRequest();
  const [data, setData] = useState<TutorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      const result = await get<TutorDashboardData>(API_ENDPOINTS.tutorDashboard);
      if (cancelled) return;
      if (result.error) {
        setError('No se pudo cargar el panel. Intenta de nuevo.');
      } else {
        setData(result.data ?? null);
      }
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { data, isLoading, error, refetch };
}
