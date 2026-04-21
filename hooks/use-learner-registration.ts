import { useState } from 'react';
import { useOAuth, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useApiRequest } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

export type RegistrationBannerError = 'network' | 'generic';

export interface LearnerFormState {
  organizationName: string;
  program: string;
  city: string;
  currentSemester: string;
  interests: string[];
}

export interface LearnerFormErrors {
  organizationName?: string;
  interests?: string;
}

/**
 * Manages the learner registration flow: form state, validation,
 * Google OAuth, and backend profile creation.
 */
export function useLearnerRegistration() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const clerk = useClerk();
  const api = useApiRequest();
  const router = useRouter();

  const [form, setForm] = useState<LearnerFormState>({
    organizationName: '',
    program: '',
    city: '',
    currentSemester: '',
    interests: [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState<RegistrationBannerError | null>(null);

  const errors: LearnerFormErrors = {
    organizationName:
      submitted && !form.organizationName.trim()
        ? 'Ingresa el nombre de tu universidad o institución'
        : undefined,
    interests:
      submitted && form.interests.length === 0
        ? 'Selecciona al menos un interés'
        : undefined,
  };

  const isFormValid =
    form.organizationName.trim().length > 0 && form.interests.length > 0;

  const addInterest = (interest: string) => {
    if (!form.interests.includes(interest)) {
      setForm((prev) => ({ ...prev, interests: [...prev.interests, interest] }));
    }
  };

  const removeInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const syncWithBackend = async () => {
    const clerkId = clerk.user?.id;
    const email = clerk.user?.primaryEmailAddress?.emailAddress;
    const firstName = clerk.user?.firstName ?? '';
    const lastName = clerk.user?.lastName ?? '';
    if (!clerkId || !email) return;

    const semester = form.currentSemester
      ? parseInt(form.currentSemester, 10)
      : undefined;

    // 201 = created, 409 = already exists — both are acceptable
    await api.post(API_ENDPOINTS.usersCreate, {
      clerkId,
      email,
      firstName,
      lastName,
      role: 'LEARNER',
      city: form.city.trim() || undefined,
      country: 'Colombia',
      organizationName: form.organizationName.trim(),
      program: form.program.trim() || undefined,
      interests: form.interests,
      currentSemester: semester,
    });
  };

  const handleRegister = async () => {
    setSubmitted(true);
    setBannerError(null);
    if (!isFormValid) return;

    setLoading(true);
    try {
      // Sign out any existing session so Google always shows the account picker.
      await clerk.signOut();

      const { createdSessionId, signUp, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        await syncWithBackend();
        router.replace('/');
      } else if (signUp?.status === 'missing_requirements') {
        router.push('/(auth)/profile-setup' as any);
      }
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED' || err?.message?.includes('cancel')) return;
      setBannerError(!err?.errors ? 'network' : 'generic');
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
    addInterest,
    removeInterest,
    handleRegister,
  };
}
