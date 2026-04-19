import { useEffect, useState } from 'react';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export interface UserProfile {
  id: number;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'LEARNER' | 'TUTOR';
  status: string;
  city?: string | null;
  country?: string;
  organizationName?: string | null;
  academicProgram?: string | null;
  interests?: string[] | null;
  currentSemester?: number | null;
}

export function useProfile() {
  const api = useApiRequest();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      const result = await api.get<UserProfile>(API_ENDPOINTS.usersMe);
      if (cancelled) return;
      if (result.error || !result.data) {
        setError('No se pudo cargar el perfil.');
      } else {
        setProfile(result.data);
      }
      setLoading(false);
    };

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { profile, loading, error };
}
