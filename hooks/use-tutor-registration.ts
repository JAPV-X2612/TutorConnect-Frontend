import { useState } from 'react';
import { useOAuth, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { resetTutorOnboarding, setTutorOnboarding } from './use-tutor-onboarding';

export type TutorAuthError = 'network' | 'generic' | 'canceled';

const ERROR_MESSAGES: Record<TutorAuthError, string> = {
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo.',
  generic: 'Ocurrió un error con Google. Intenta de nuevo.',
  canceled: '',
};

export function useTutorRegistration() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const clerk = useClerk();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<TutorAuthError | null>(null);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      resetTutorOnboarding();

      const { createdSessionId, signUp, setActive } = await startOAuthFlow();
      let sessionId: string | null = createdSessionId ?? null;

      if (!sessionId && signUp?.status === 'missing_requirements') {
        const completed = await signUp.update({ unsafeMetadata: { role: 'TUTOR' } });
        sessionId = completed.createdSessionId ?? null;
      }

      if (!sessionId) { setError('generic'); return; }

      await setActive!({ session: sessionId });

      setTutorOnboarding({
        nombre: clerk.user?.firstName ?? '',
        apellido: clerk.user?.lastName ?? '',
      });

      router.push('/(auth)/tutor-detalles' as any);
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED' || err?.message?.includes('cancel')) {
        setError('canceled');
        return;
      }
      setError(!err?.errors ? 'network' : 'generic');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    errorMessage: error && error !== 'canceled' ? ERROR_MESSAGES[error] : null,
    handleRegister,
  };
}
