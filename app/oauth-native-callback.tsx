import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";

export default function OAuthNativeCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !userLoaded) return;
    if (isSignedIn) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  }, [isSignedIn, isLoaded, userLoaded, user, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color="#006A75" />
    </View>
  );
}
