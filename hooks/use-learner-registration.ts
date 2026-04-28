import { useState } from 'react';
import { useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export type LearnerAuthError = 'network' | 'generic' | 'canceled';

const ERROR_MESSAGES: Record<LearnerAuthError, string> = {
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo.',
  generic: 'Ocurrió un error con Google. Intenta de nuevo.',
  canceled: '',
};

export function useLearnerRegistration() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LearnerAuthError | null>(null);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      const { createdSessionId, signUp, setActive } = await startOAuthFlow();
      let sessionId: string | null = createdSessionId ?? null;

      if (!sessionId && signUp?.status === 'missing_requirements') {
        const completed = await signUp.update({});
        sessionId = completed.createdSessionId ?? null;
      }

      if (!sessionId) { setError('generic'); return; }

      await setActive!({ session: sessionId });
      router.push('/(auth)/profile-setup' as any);
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
