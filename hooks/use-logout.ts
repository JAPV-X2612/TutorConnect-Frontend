import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export function useLogout() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await signOut();
      router.replace('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
}
