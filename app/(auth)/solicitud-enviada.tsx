import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SolicitudEnviadaScreen() {
  const router = useRouter();

  const handleGoHome = () => {
    router.replace('/(tutor)/dashboard');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center items-center">
        {/* Success Icon */}
        <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
          <Ionicons name="checkmark-sharp" size={40} color="#22c55e" />
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-text-primary text-center mb-3">
          ¡Solicitud Enviada!
        </Text>

        {/* Description */}
        <Text className="text-base text-text-muted text-center mb-10">
          Tu solicitud fue enviada. La revisaremos en menos de 24 horas.
        </Text>

        {/* Go Home Button */}
        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.85}
          className="rounded-full py-4 px-8 bg-primary items-center w-full"
        >
          <Text className="text-base font-semibold text-primary-foreground">
            Ir al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
