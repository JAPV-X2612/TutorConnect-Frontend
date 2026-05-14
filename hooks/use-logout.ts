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
      // Navigate first so the tab tree is unmounted before Clerk clears its
      // state. Calling signOut() first causes user → null mid-render, which
      // makes the tab layout switch structures and triggers an addViewAt crash
      // in Fabric on Android.
      router.replace('/onboarding');
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
}
