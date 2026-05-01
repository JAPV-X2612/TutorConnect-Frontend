import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { API_ENDPOINTS } from '@/constants/api';
import { useApiRequest } from '@/services/api';
import { useChat, type ChatMessage } from '@/hooks/use-chat';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourseInfo {
  id: string;
  subject: string;
  price: number;
  duration: number;
  modalidad: string;
}

interface BookingInfo {
  id: string;
  status: string;
  startTime: string;
}

interface Channel {
  id: number;
  isActive: boolean;
  expiresAt: string | null;
  otherUser: { id: number; clerkId: string; firstName: string; lastName: string };
  course: CourseInfo | null;
  booking: BookingInfo | null;
  lastMessage: { content: string; sentAt: string; fromMe: boolean } | null;
  /** Unread message count provided by the backend; 0 if absent. */
  unreadCount?: number;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#006A75', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0)
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (diffDays === 1) return 'Ayer';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

// ── ChannelItem ───────────────────────────────────────────────────────────────
// The course is the primary identity of the conversation — users may have
// multiple channels with the same tutor for different courses.

function ChannelItem({ channel, onPress }: { channel: Channel; onPress: () => void }) {
  const tutorName = `${channel.otherUser.firstName} ${channel.otherUser.lastName}`;
  const courseName = channel.course?.subject ?? 'Sin curso';
  const preview = channel.lastMessage
    ? channel.lastMessage.fromMe
      ? `Tú: ${channel.lastMessage.content}`
      : channel.lastMessage.content
    : 'Inicia la conversación';
  const time = channel.lastMessage ? formatTime(channel.lastMessage.sentAt) : '';
  const isExpired = channel.expiresAt ? new Date(channel.expiresAt) < new Date() : false;
  const hasUnread = (channel.unreadCount ?? 0) > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`Chat de ${courseName} con ${tutorName}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
      }}
    >
      {/* Course icon */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 14,
          backgroundColor: '#F0FDFA',
          borderWidth: 1,
          borderColor: '#99F6E4',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons name="book-outline" size={22} color="#0D9488" />
      </View>

      {/* Content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* Course name + time + unread badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 3,
          }}
        >
          <Text
            style={{ color: '#0F172A', fontWeight: '700', fontSize: 14, flex: 1 }}
            numberOfLines={1}
          >
            {courseName}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {hasUnread && (
              <View
                style={{
                  backgroundColor: '#006A75',
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                  {channel.unreadCount}
                </Text>
              </View>
            )}
            <Text style={{ color: '#94A3B8', fontSize: 11 }}>{time}</Text>
          </View>
        </View>

        {/* Tutor row + status chips */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            marginBottom: 4,
            flexWrap: 'wrap',
          }}
        >
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: avatarColor(tutorName),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>
              {tutorName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '500' }} numberOfLines={1}>
            {tutorName}
          </Text>
          {channel.booking?.status === 'confirmed' && (
            <View style={{ paddingHorizontal: 6, paddingVertical: 1, backgroundColor: '#D1FAE5', borderRadius: 99 }}>
              <Text style={{ color: '#065F46', fontSize: 9, fontWeight: '700' }}>CONFIRMADA</Text>
            </View>
          )}
          {channel.booking?.status === 'pending' && (
            <View style={{ paddingHorizontal: 6, paddingVertical: 1, backgroundColor: '#FEF9C3', borderRadius: 99 }}>
              <Text style={{ color: '#854D0E', fontSize: 9, fontWeight: '700' }}>PENDIENTE</Text>
            </View>
          )}
          {isExpired && (
            <View style={{ paddingHorizontal: 6, paddingVertical: 1, backgroundColor: '#F1F5F9', borderRadius: 99 }}>
              <Text style={{ color: '#94A3B8', fontSize: 9, fontWeight: '600' }}>EXPIRADO</Text>
            </View>
          )}
        </View>

        {/* Last message preview */}
        <Text
          style={{
            color: hasUnread ? '#0F172A' : '#94A3B8',
            fontSize: 12,
            fontWeight: hasUnread ? '500' : '400',
          }}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  return (
    <View
      className={`mb-2 px-4 max-w-[80%] ${msg.fromMe ? 'self-end items-end' : 'self-start items-start'}`}
    >
      <View
        className={`px-4 py-2.5 rounded-2xl ${
          msg.fromMe
            ? 'bg-primary rounded-tr-sm'
            : 'bg-white border border-border rounded-tl-sm'
        }`}
      >
        <Text className={`text-sm leading-5 ${msg.fromMe ? 'text-white' : 'text-text-primary'}`}>
          {msg.content}
        </Text>
      </View>
      <Text className="text-xs text-text-muted mt-1">
        {new Date(msg.sentAt).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </Text>
    </View>
  );
}

// ── ChatView ──────────────────────────────────────────────────────────────────

function ChatView({ channel, onBack, isTutor }: { channel: Channel; onBack: () => void; isTutor: boolean }) {
  const { get } = useApiRequest();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const tutorName = `${channel.otherUser.firstName} ${channel.otherUser.lastName}`;
  const courseName = channel.course?.subject ?? 'Chat';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const load = async () => {
      const res = await get<ChatMessage[]>(API_ENDPOINTS.messagingMessages(channel.id));
      if (Array.isArray(res.data)) setMessages(res.data);
      setLoadingHistory(false);
    };
    void load();
  }, [channel.id]);

  const { connected, sendMessage } = useChat(channel.id, (msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !connected) return;
    sendMessage(trimmed);
    setText('');
  };

  const bookingDate = channel.booking?.startTime
    ? new Date(channel.booking.startTime).toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    : null;
  const bookingTime = channel.booking?.startTime
    ? new Date(channel.booking.startTime).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : null;
  // Only tutors see the expiry banner — the learner initiated the chat and
  // doesn't need a countdown; the tutor needs context on the channel's lifetime.
  const expiryLabel = (() => {
    if (!isTutor || !channel.expiresAt) return null;
    const remaining = new Date(channel.expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'Chat expirado';
    return `Expira en ${Math.floor(remaining / 3_600_000)}h · Sin reserva confirmada`;
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        {/* Row 1: back + course icon + course title + tutor */}
        <View className="flex-row items-center px-4 pt-3 pb-3 gap-3">
          <TouchableOpacity
            onPress={onBack}
            className="p-1 -ml-1"
            accessibilityLabel="Volver a mensajes"
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: '#F0FDFA',
              borderWidth: 1,
              borderColor: '#99F6E4',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="book-outline" size={20} color="#0D9488" />
          </View>

          <View className="flex-1">
            <Text
              className="text-text-primary font-bold text-base leading-tight"
              numberOfLines={1}
            >
              {courseName}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: avatarColor(tutorName),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 7, fontWeight: '700' }}>
                  {tutorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#64748B' }}>{tutorName}</Text>
              <Text style={{ fontSize: 11, color: '#CBD5E1' }}>·</Text>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: connected ? '#22C55E' : '#CBD5E1',
                }}
              />
              <Text style={{ fontSize: 11, color: connected ? '#16A34A' : '#94A3B8' }}>
                {connected ? 'En línea' : 'Desconectado'}
              </Text>
            </View>
          </View>
        </View>

        {/* Row 2: course details card */}
        {channel.course && (
          <View
            className="mx-4 mb-3 rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4' }}
          >
            <View className="flex-row flex-wrap gap-1.5 px-4 pt-3 pb-2">
              {[
                `$${channel.course.price.toLocaleString('es-CO')}`,
                channel.course.modalidad,
                `${channel.course.duration} min`,
              ].map((chip) => (
                <View
                  key={chip}
                  style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#E0F2FE', borderRadius: 99 }}
                >
                  <Text style={{ color: '#0369A1', fontSize: 11, fontWeight: '600' }}>{chip}</Text>
                </View>
              ))}
            </View>

            {bookingDate && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: '#99F6E4',
                  backgroundColor: '#ECFDF5',
                }}
              >
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="calendar-outline" size={13} color="#059669" />
                  <Text
                    style={{
                      color: '#047857',
                      fontSize: 12,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {bookingDate}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>·</Text>
                  <Text style={{ color: '#047857', fontSize: 12, fontWeight: '600' }}>
                    {bookingTime}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      backgroundColor: '#D1FAE5',
                      borderRadius: 99,
                    }}
                  >
                    <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 }}>
                      CONFIRMADA
                    </Text>
                  </View>
                  {!isTutor && (
                    <TouchableOpacity
                      onPress={() => router.push(`/(learner)/booking/${channel.course!.id}` as any)}
                      accessibilityLabel="Reagendar sesión"
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        backgroundColor: '#CCFBF1',
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ color: '#0D9488', fontSize: 11, fontWeight: '700' }}>
                        Reagendar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Expiry banner */}
        {expiryLabel && (
          <View
            className="flex-row items-center gap-2 mx-4 mb-3 px-3 py-2 rounded-xl"
            style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D' }}
          >
            <Ionicons name="time-outline" size={14} color="#D97706" />
            <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '500', flex: 1 }}>
              {expiryLabel}
            </Text>
          </View>
        )}
      </View>

      {/* KAV wraps messages + input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loadingHistory ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#006A75" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            style={{ flex: 1, backgroundColor: '#F8FAFC' }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons name="chatbubble-outline" size={40} color="#CBD5E1" />
                <Text className="text-text-muted text-sm mt-3">Sé el primero en escribir</Text>
              </View>
            }
          />
        )}

        <View
          className="flex-row items-end px-4 pt-3 border-t border-border bg-white gap-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-text-primary"
            placeholder="Escribe un mensaje..."
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            style={{ maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || !connected}
            activeOpacity={0.8}
            accessibilityLabel="Enviar mensaje"
            className={`w-10 h-10 rounded-full items-center justify-center ${
              text.trim() && connected ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <Ionicons
              name="send"
              size={18}
              color={text.trim() && connected ? 'white' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── MensajesScreen ────────────────────────────────────────────────────────────

/**
 * Shared messaging screen for learners and tutors.
 * Each channel is scoped to a specific course — a user may have multiple
 * channels with the same person for different courses. The course name is the
 * primary identifier; the tutor/learner name is secondary.
 *
 * @author TutorConnect Team
 */
export function MensajesScreen() {
  const { user } = useUser();
  const isTutor = user?.publicMetadata?.role === 'TUTOR';

  const { get } = useApiRequest();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  // channelId param: set by course detail screen to open a specific chat directly.
  const { channelId: autoOpenId } = useLocalSearchParams<{ channelId?: string }>();
  // Tracks the last channelId that triggered an auto-open so the same navigation
  // doesn't re-open the chat if the user intentionally went back to the list,
  // while still allowing a different channelId (different course) to open.
  const lastAutoOpenedRef = useRef<string | null>(null);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    const res = await get<Channel[]>(API_ENDPOINTS.messagingChannels);
    if (Array.isArray(res.data)) setChannels(res.data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void loadChannels(); }, [loadChannels]));

  // Once channels load, auto-open the channel requested via the param.
  useEffect(() => {
    if (!autoOpenId || loading || channels.length === 0) return;
    if (lastAutoOpenedRef.current === autoOpenId) return;
    const ch = channels.find((c) => String(c.id) === autoOpenId);
    if (ch) {
      lastAutoOpenedRef.current = autoOpenId;
      setActiveChannel(ch);
    }
  }, [autoOpenId, channels, loading]);

  // Reset the guard when the user closes a chat so the same channel can be
  // auto-opened again on a subsequent navigation from the course detail screen.
  const handleBackFromChat = useCallback(() => {
    lastAutoOpenedRef.current = null;
    setActiveChannel(null);
  }, []);

  const filtered = search.trim()
    ? channels.filter((c) => {
        const q = search.toLowerCase();
        const course = (c.course?.subject ?? '').toLowerCase();
        const person = `${c.otherUser.firstName} ${c.otherUser.lastName}`.toLowerCase();
        return course.includes(q) || person.includes(q);
      })
    : channels;

  if (activeChannel) {
    return <ChatView channel={activeChannel} onBack={handleBackFromChat} isTutor={isTutor} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 border-b border-border">
        <Text className="text-2xl font-bold text-text-primary">Mensajes</Text>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F1F5F9',
            borderRadius: 14,
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: '#0F172A' }}
            placeholder="Buscar por curso o tutor..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              accessibilityLabel="Limpiar búsqueda"
            >
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#006A75" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => (
            <ChannelItem channel={item} onPress={() => setActiveChannel(item)} />
          )}
          ListEmptyComponent={
            search.trim() ? (
              <View className="flex-1 items-center justify-center px-6 pt-24">
                <Ionicons name="search-outline" size={44} color="#CBD5E1" />
                <Text className="text-text-primary font-semibold text-lg mt-4">
                  Sin resultados
                </Text>
                <Text className="text-text-muted text-sm text-center mt-2 leading-5">
                  No se encontraron chats para "{search}".
                </Text>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center px-6 pt-24">
                <Ionicons name="chatbubbles-outline" size={52} color="#CBD5E1" />
                <Text className="text-text-primary font-semibold text-lg mt-4">
                  Sin conversaciones
                </Text>
                <Text className="text-text-muted text-sm text-center mt-2 leading-5">
                  Aquí aparecerán tus chats al reservar una sesión con un tutor.
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
