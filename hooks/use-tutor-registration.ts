import { useState } from 'react';
import { useOAuth, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useApiRequest } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

export type TutorRegistrationBannerError = 'conflict' | 'network' | 'generic' | 'unauthorized';

export interface TutorFormState {
  nombre: string;
  apellido: string;
  descripcion: string;
}

export interface TutorFormErrors {
  nombre?: string;
  apellido?: string;
}

/**
 * Manages the tutor registration flow: form state, validation,
 * Google OAuth, backend user creation, and tutor profile registration.
 *
 * @author TutorConnect Team
 */
export function useTutorRegistration() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const clerk = useClerk();
  const api = useApiRequest();
  const router = useRouter();

  const [form, setForm] = useState<TutorFormState>({
    nombre: '',
    apellido: '',
    descripcion: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<TutorRegistrationBannerError | null>(null);

  const errors: TutorFormErrors = {
    nombre: submitted && form.nombre.trim().length < 2 ? 'Requerido, mín 2 caracteres' : undefined,
    apellido: submitted && form.apellido.trim().length < 2 ? 'Requerido, mín 2 caracteres' : undefined,
  };

  const isFormValid = form.nombre.trim().length >= 2 && form.apellido.trim().length >= 2;

  const handleRegister = async () => {
    setSubmitted(true);
    setBannerError(null);
    if (!isFormValid) return;

    setLoading(true);
    try {
      await clerk.signOut();

      const { createdSessionId, setActive } = await startOAuthFlow();

      if (!createdSessionId) {
        setBannerError('unauthorized');
        return;
      }

      await setActive!({ session: createdSessionId });

      const clerkId = clerk.user?.id;
      const email = clerk.user?.primaryEmailAddress?.emailAddress;
      const firstName = clerk.user?.firstName ?? form.nombre.trim();
      const lastName = clerk.user?.lastName ?? form.apellido.trim();

      // Create user profile — 409 (already exists) is acceptable
      await api.post(API_ENDPOINTS.usersCreate, {
        clerkId,
        email,
        firstName,
        lastName,
        role: 'TUTOR',
        country: 'Colombia',
      });

      // Register tutor profile with JWT from the active Clerk session
      const response = await api.post(API_ENDPOINTS.tutorRegister, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        descripcion: form.descripcion.trim() || undefined,
      });

      if (response.status === 201 || response.status === 200) {
        router.push('/(auth)/tutor-certificaciones' as any);
      } else if (response.status === 409) {
        setBannerError('conflict');
      } else if (response.status === 0) {
        setBannerError('network');
      } else {
        setBannerError('generic');
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string; errors?: unknown[] };
      if (error?.code === 'ERR_CANCELED' || error?.message?.includes('cancel')) return;
      setBannerError(error?.errors ? 'generic' : 'network');
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setForm,
    submitted,
    loading,
    bannerError,
    errors,
    isFormValid,
    handleRegister,
  };
}
