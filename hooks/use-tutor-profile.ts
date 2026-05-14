import { useEffect, useState, useCallback } from 'react';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

export interface TutorProfile {
  exists: boolean;
  id?: string;
  nombre?: string;
  apellido?: string;
  cedula?: string;
  descripcion?: string;
  bio?: string;
  subjects?: string[];
  estado?: string;
  disponible?: boolean;
  rating?: number;
  hasCertificaciones?: boolean;
  user?: {
    email?: string;
    city?: string;
    country?: string;
  };
}

export interface UpdateTutorPayload {
  nombre?: string;
  apellido?: string;
  cedula?: string;
  ciudad?: string;
  descripcion?: string;
  bio?: string;
  subjects?: string[];
  disponible?: boolean;
}

export function useTutorProfile() {
  const api = useApiRequest();
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<TutorProfile>(API_ENDPOINTS.tutorMe);
    if (res.error || !res.data) {
      setError('No se pudo cargar el perfil.');
    } else {
      setProfile(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (payload: UpdateTutorPayload): Promise<boolean> => {
    setSaving(true);
    setError(null);
    const res = await api.put<TutorProfile>(API_ENDPOINTS.tutorMe, payload);
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
