import { useCallback, useEffect, useState } from 'react';
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

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  city?: string;
  organizationName?: string;
  academicProgram?: string;
  interests?: string[];
}

export function useProfile() {
  const api = useApiRequest();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.get<UserProfile>(API_ENDPOINTS.usersMe);
    if (result.error || !result.data) {
      setError('No se pudo cargar el perfil.');
    } else {
      setProfile(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (payload: UpdateProfilePayload): Promise<boolean> => {
    setSaving(true);
    setError(null);
    const res = await api.patch<UserProfile>(API_ENDPOINTS.usersMeUpdate, payload);
    setSaving(false);
    if (res.error || !res.data) {
      setError('No se pudieron guardar los cambios.');
      return false;
    }
    setProfile(res.data);
    return true;
  };

  return { profile, loading, saving, error, refetch: fetch, update };
}
