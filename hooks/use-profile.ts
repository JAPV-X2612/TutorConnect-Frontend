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
  currentSemester?: number | null;
}

/**
 * Fetches the authenticated user's platform profile from `GET /users/me`.
 *
 * Skips the network call when the Clerk session is not loaded or the user
 * is not signed in — avoids indefinite spinners when there is no identity
 * to query for.
 *
 * @author TutorConnect Team
 */
export function useProfile() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const api = useApiRequest();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        setError('No se pudo cargar el perfil.');
        setProfile(null);
      } else {
        setProfile(result.data);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // `api` identity changes each render; its underlying Clerk getToken is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, isSignedIn]);

  return { profile, loading, error };
}
