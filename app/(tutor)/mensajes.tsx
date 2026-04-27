import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  subject: string;
}

const AVATAR_COLORS = ['#006A75', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function ConversationItem({ item }: { item: Conversation }) {
  return (
    <TouchableOpacity activeOpacity={0.7}
      className="flex-row items-center px-6 py-4 border-b border-border gap-3">
      <View className="w-12 h-12 rounded-full items-center justify-center flex-shrink-0"
        style={{ backgroundColor: getAvatarColor(item.name) }}>
        <Text className="text-white font-bold text-base">{item.name.charAt(0).toUpperCase()}</Text>
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between">
          <Text className="text-text-primary font-semibold text-sm">{item.name}</Text>
          <Text className="text-text-muted text-xs">{item.time}</Text>
        </View>
        <Text className="text-primary text-xs mb-0.5">{item.subject}</Text>
        <Text className="text-text-muted text-sm" numberOfLines={1}>{item.lastMessage}</Text>
      </View>

      {item.unread > 0 && (
        <View className="w-5 h-5 rounded-full bg-primary items-center justify-center flex-shrink-0">
          <Text className="text-white text-xs font-bold">{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MensajesScreen() {
  const conversations: Conversation[] = [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-3 border-b border-border">
        <Text className="text-2xl font-bold text-text-primary">Mensajes</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConversationItem item={item} />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6 pt-24">
            <Ionicons name="chatbubbles-outline" size={52} color="#CBD5E1" />
            <Text className="text-text-primary font-semibold text-lg mt-4">Sin conversaciones</Text>
            <Text className="text-text-muted text-sm text-center mt-2 leading-5">
              Cuando un estudiante reserve una sesión contigo podrán chatear aquí.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
