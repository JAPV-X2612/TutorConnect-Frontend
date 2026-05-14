import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLearnerRegistration } from '../../hooks/use-learner-registration';
import { COURSE_CATEGORIES } from '@/constants/registration-options';
import { CategoryIcon } from '@/constants/category-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { loading, errorMessage, handleRegister } = useLearnerRegistration();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-between py-10">
        {/* Header */}
        <View className="items-center pt-8">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
            <Ionicons name="school" size={40} color="#1a3c5e" />
          </View>
          <Text className="text-3xl font-bold text-text-primary text-center mb-3">
            Empieza a aprender
          </Text>
          <Text className="text-base text-text-muted text-center leading-6 px-4">
            Desde cálculo multivariado hasta cocina francesa.{'\n'}
            Conecta con tutores expertos en lo que quieras aprender.
          </Text>
        </View>

        {/* Categories preview */}
        <View className="flex-row flex-wrap justify-center gap-2 px-2">
          {COURSE_CATEGORIES.map((cat) => (
            <View
              key={cat.id}
              className="flex-row items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1.5"
            >
              <CategoryIcon id={cat.id} size={14} color="#006A75" />
              <Text className="text-xs font-medium text-text-primary">{cat.label}</Text>
            </View>
          ))}
        </View>

        {/* Bottom section */}
        <View>
          {errorMessage && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm text-center">{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            className="flex-row items-center justify-center gap-3 bg-white border border-border rounded-full py-4 shadow-sm mb-4"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#1a3c5e" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text className="text-base font-semibold text-text-primary">
                  Continuar con Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-sm text-text-muted">¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
              <Text className="text-sm text-primary font-semibold">Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
