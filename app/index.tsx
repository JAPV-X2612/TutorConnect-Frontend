import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#006A75" />
      </View>
    );
  }

  if (isSignedIn) {
    const role = user?.publicMetadata?.role as string | undefined;
    return <Redirect href={role === 'TUTOR' ? '/(tutor)/dashboard' : '/(tabs)'} />;
  }

  return <Redirect href="/onboarding" />;
}
