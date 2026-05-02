import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
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
  learningGoal?: string | null;
  studentType?: string | null;
  currentSemester?: number | null;
  schoolGrade?: number | null;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  city?: string;
  organizationName?: string;
  academicProgram?: string;
  interests?: string[];
  learningGoal?: string;
  studentType?: string;
  currentSemester?: number;
  schoolGrade?: number;
}

/**
 * Fetches and manages the authenticated user's platform profile.
 *
 * Skips the network call when Clerk is not loaded or the user is not signed
 * in. Exposes `update()` for in-place edits and `refetch()` for manual
 * reloads (e.g. after screen focus).
 *
 * @author TutorConnect Team
 */
export function useProfile() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const api = useApiRequest();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = () => {
    if (!authLoaded) return;

    if (!isSignedIn) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get<UserProfile>(API_ENDPOINTS.usersMe).then((result) => {
      if (cancelled) return;
      if (result.error || !result.data) {
        setError(`Error ${result.status}: ${result.error ?? 'sin datos'} | URL: ${API_ENDPOINTS.usersMe}`);
        setProfile(null);
      } else {
        setProfile(result.data);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  };

  useEffect(() => {
    const cleanup = fetchProfile();
    return cleanup;
    // `api` identity changes each render; its underlying Clerk getToken is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, isSignedIn]);

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

  return { profile, loading, saving, error, refetch: fetchProfile, update };
}
