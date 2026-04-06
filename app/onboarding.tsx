import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Role = 'aprendiz' | 'tutor';

export default function OnboardingScreen() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push({ pathname: '/(auth)/register', params: { role: selectedRole } });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="items-center pt-14 px-6">
        <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
          <Ionicons name="school" size={30} color="#FFFFFF" />
        </View>
        <Text className="text-3xl font-bold text-text-primary tracking-tight">
          TutorConnect
        </Text>
        <Text className="text-base text-primary mt-1">
          Aprende y enseña sin límites
        </Text>
      </View>

      {/* Role selection */}
      <View className="flex-1 mt-10 px-6">
        <Text className="text-xl font-bold text-text-primary text-center">
          ¿Cómo te gustaría empezar?
        </Text>
        <Text className="text-sm text-text-muted text-center mt-1 mb-8">
          Elige una opción para personalizar tu experiencia
        </Text>

        {/* Aprendiz */}
        <TouchableOpacity
          onPress={() => setSelectedRole('aprendiz')}
          activeOpacity={0.85}
        >
          <View
            className={`items-center py-6 rounded-2xl ${
              selectedRole === 'aprendiz' ? 'border-2 border-primary bg-primary/5' : 'border border-transparent'
            }`}
          >
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
              <MaterialCommunityIcons
                name="account-search-outline"
                size={36}
                color="#006A75"
              />
            </View>
            <Text className="text-lg font-bold text-text-primary mb-1">
              Soy Aprendiz
            </Text>
            <Text className="text-sm text-text-muted text-center px-6">
              Busco aprender algo nuevo y conectar con expertos.
            </Text>
          </View>
        </TouchableOpacity>

        <View className="h-px bg-border mx-2 my-1" />

        {/* Tutor */}
        <TouchableOpacity
          onPress={() => setSelectedRole('tutor')}
          activeOpacity={0.85}
        >
          <View
            className={`items-center py-6 rounded-2xl ${
              selectedRole === 'tutor' ? 'border-2 border-accent bg-accent/5' : 'border border-transparent'
            }`}
          >
            <View className="w-20 h-20 rounded-full bg-accent/10 items-center justify-center mb-4">
              <MaterialCommunityIcons
                name="book-account-outline"
                size={36}
                color="#F97316"
              />
            </View>
            <Text className="text-lg font-bold text-text-primary mb-1">
              Soy Tutor
            </Text>
            <Text className="text-sm text-text-muted text-center px-6">
              Quiero compartir mi conocimiento y ganar dinero.
            </Text>
          </View>
        </TouchableOpacity>

      </View>

      {/* Footer */}
      <View className="px-6 pt-4 pb-10 gap-4">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.85}
          className={`rounded-full py-4 items-center ${
            selectedRole ? 'bg-primary' : 'bg-secondary'
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              selectedRole ? 'text-primary-foreground' : 'text-text-muted'
            }`}
          >
            Continuar →
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-sm text-text-muted">¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
            <Text className="text-sm text-text-link font-semibold">
              Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
