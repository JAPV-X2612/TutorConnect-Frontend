import { useEffect } from 'react';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useApiRequest } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

/**
 * Valida la sesión activa contra el backend al montar el componente.
 * Si el backend responde 401 (token expirado o revocado), cierra la sesión
 * local de Clerk y redirige al onboarding.
 */
export function useSessionGuard() {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { get } = useApiRequest();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const checkSession = async () => {
      const res = await get(API_ENDPOINTS.authMe);
      if (res.status === 401) {
        await signOut();
        router.replace('/onboarding');
      }
    };

    checkSession();
  }, [isLoaded, isSignedIn]);
}