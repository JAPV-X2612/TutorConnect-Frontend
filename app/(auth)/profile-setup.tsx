import { useClerk, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COURSE_CATEGORIES } from '@/constants/registration-options';

export default function ProfileSetupScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const api = useApiRequest();
  const router = useRouter();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const handleContinue = async () => {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError(null);
    try {
      if (signUp.status === 'complete') {
        await setActive!({ session: signUp.createdSessionId });
      }

      const clerkId = clerk.user?.id;
      const email = clerk.user?.primaryEmailAddress?.emailAddress;
      const firstName = clerk.user?.firstName ?? '';
      const lastName = clerk.user?.lastName ?? '';

      if (clerkId && email) {
        await api.post(API_ENDPOINTS.usersCreate, {
          clerkId,
          email,
          firstName,
          lastName,
          role: 'LEARNER',
          interests: selectedCategories.length > 0 ? selectedCategories : undefined,
        });
      }

      // Redirect through index so role-based routing resolves correctly
      router.replace('/');
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="pt-10 pb-6">
          <Text className="text-3xl font-bold text-text-primary mb-2">
            ¿Qué quieres aprender?
          </Text>
          <Text className="text-base text-text-muted leading-6">
            Selecciona las categorías que te interesan. Puedes cambiarlas en cualquier momento.
          </Text>
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        <View className="flex-row flex-wrap gap-3 mb-8">
          {COURSE_CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat.label);
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => toggleCategory(cat.label)}
                activeOpacity={0.8}
                className={`rounded-2xl px-4 py-3 flex-row items-center gap-2 border ${
                  selected ? 'bg-primary border-primary' : 'bg-white border-border'
                }`}
              >
                <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-text-primary'}`}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
          className="bg-primary rounded-full py-4 items-center flex-row justify-center gap-2"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {selectedCategories.length > 0 ? 'Empezar a explorar' : 'Saltar por ahora'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
