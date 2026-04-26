import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../constants/api';
import { useApiRequest } from '../services/api';

export interface WeeklyProgress {
  completed: number;
  total: number;
}

export interface UpcomingSession {
  id: string;
  subject: string;
  tutorName: string;
  scheduledAt: string;
  status: string;
}

export interface LearnerDashboard {
  weeklyProgress: WeeklyProgress;
  upcomingSessions: UpcomingSession[];
}

/**
 * Fetches and manages the learner dashboard data from the backend.
 *
 * Provides weekly progress and upcoming sessions. Exposes a `refetch`
 * callback to manually reload the data.
 *
 * @returns Dashboard state: `data`, `loading`, `error`, and `refetch`.
 * @example
 * const { data, loading, error, refetch } = useLearnerDashboard();
 *
 * @author TutorConnect Team
 */
export function useLearnerDashboard() {
  const api = useApiRequest();
  const [data, setData] = useState<LearnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      const response = await api.get<LearnerDashboard>(API_ENDPOINTS.learnerDashboard);

      if (!active) return;

      if (response.status === 200 && response.data) {
        setData(response.data);
      } else {
        setError(response.error ?? 'Error al cargar el panel');
      }

      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
    // api identity changes each render but the underlying Clerk getToken is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCount]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefreshCount((c) => c + 1),
  };
}
