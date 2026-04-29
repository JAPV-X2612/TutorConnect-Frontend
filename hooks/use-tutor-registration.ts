import { useRef, useState } from 'react';
import { useOAuth, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
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
  const inFlight = useRef(false);

  const navigateNext = () => {
    setTutorOnboarding({
      nombre: clerk.user?.firstName ?? '',
      apellido: clerk.user?.lastName ?? '',
    });
    router.push('/(auth)/tutor-detalles' as any);
  };

  const handleRegister = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setLoading(true);
    try {
      // Already signed in — skip OAuth and go to next step.
      if (clerk.session) {
        navigateNext();
        return;
      }

      resetTutorOnboarding();

      const redirectUrl = Linking.createURL('oauth-native-callback');

      const { createdSessionId, signUp, setActive } = await startOAuthFlow({
        redirectUrl,
        unsafeMetadata: { role: 'TUTOR' },
      });
      let sessionId: string | null = createdSessionId ?? null;

      if (!sessionId && signUp?.status === 'missing_requirements') {
        const completed = await signUp.update({ unsafeMetadata: { role: 'TUTOR' } });
        sessionId = completed.createdSessionId ?? null;
      }

      if (!sessionId) { setError('generic'); return; }

      await setActive!({ session: sessionId });
      // Wait for Clerk to fully propagate the session before navigating.
      // Without this, the next screen's useAuth() throws "Invalid state"
      // because the session context hasn't settled yet.
      await new Promise((r) => setTimeout(r, 400));
      navigateNext();
    } catch (err: any) {
      const clerkCode = err?.errors?.[0]?.code;
      if (clerkCode === 'session_exists') {
        navigateNext();
        return;
      }
      if (err?.code === 'ERR_CANCELED' || err?.message?.includes('cancel')) {
        setError('canceled');
        return;
      }
      setError(!err?.errors ? 'network' : 'generic');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  return {
    loading,
    error,
    errorMessage: error && error !== 'canceled' ? ERROR_MESSAGES[error] : null,
    handleRegister,
  };
}
