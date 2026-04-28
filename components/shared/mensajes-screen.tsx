import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  createdAt: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#006A75', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (diffDays === 1) return 'Ayer';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function ChannelItem({ channel, onPress }: { channel: Channel; onPress: () => void }) {
  const name = `${channel.otherUser.firstName} ${channel.otherUser.lastName}`;
  const preview = channel.lastMessage?.content ?? 'Inicia la conversación';
  const time = channel.lastMessage ? formatTime(channel.lastMessage.sentAt) : '';

  const bookingStatus = channel.booking?.status;
  const expiresAt = channel.expiresAt;
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 }}>
      {/* Avatar */}
      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: avatarColor(name), alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{name.charAt(0).toUpperCase()}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{name}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 11, marginLeft: 8, flexShrink: 0 }}>{time}</Text>
        </View>

        {/* Course chip */}
        {channel.course && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: '#F0FDFA', borderRadius: 99, borderWidth: 1, borderColor: '#99F6E4' }}>
              <Text style={{ color: '#0D9488', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                {channel.course.subject}
              </Text>
            </View>
            {bookingStatus === 'confirmed' && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: '#D1FAE5', borderRadius: 99 }}>
                <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '700' }}>CONFIRMADA</Text>
              </View>
            )}
            {bookingStatus === 'pending' && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: '#FEF9C3', borderRadius: 99 }}>
                <Text style={{ color: '#854D0E', fontSize: 10, fontWeight: '700' }}>PENDIENTE</Text>
              </View>
            )}
            {!bookingStatus && !isExpired && expiresAt && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: '#FEF3C7', borderRadius: 99 }}>
                <Text style={{ color: '#92400E', fontSize: 10, fontWeight: '600' }}>24 h</Text>
              </View>
            )}
            {isExpired && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: '#F1F5F9', borderRadius: 99 }}>
                <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '600' }}>EXPIRADO</Text>
              </View>
            )}
          </View>
        )}

        {/* Last message */}
        <Text style={{ color: '#64748B', fontSize: 13 }} numberOfLines={1}>{preview}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Info sheet ────────────────────────────────────────────────────────────────

function InfoSheet({
  channel,
  visible,
  onClose,
  onReschedule,
}: {
  channel: Channel;
  visible: boolean;
  onClose: () => void;
  onReschedule: () => void;
}) {
  const name = `${channel.otherUser.firstName} ${channel.otherUser.lastName}`;

  const bookingDate = channel.booking?.startTime
    ? new Date(channel.booking.startTime).toLocaleDateString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null;
  const bookingTime = channel.booking?.startTime
    ? new Date(channel.booking.startTime).toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
    : null;
  const expiresAt = channel.expiresAt
    ? (() => {
        const rem = new Date(channel.expiresAt).getTime() - Date.now();
        if (rem <= 0) return 'Chat expirado';
        return `Expira en ${Math.floor(rem / 3_600_000)}h — reserva para continuar`;
      })()
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} />
      <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 }}>
          {/* Tutor identity */}
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: avatarColor(name), alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 28 }}>{name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 20, marginBottom: 6 }}>{name}</Text>
            <View style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#F0FDFA', borderRadius: 99, borderWidth: 1, borderColor: '#99F6E4' }}>
              <Text style={{ color: '#0D9488', fontWeight: '600', fontSize: 13 }}>Tutor</Text>
            </View>
          </View>

          {/* Course card */}
          {channel.course && (
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, overflow: 'hidden' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Curso</Text>
                <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 17, marginBottom: 10 }}>{channel.course.subject}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { icon: 'cash-outline', label: `$${channel.course.price.toLocaleString('es-CO')} COP` },
                    { icon: 'laptop-outline', label: channel.course.modalidad },
                    { icon: 'time-outline', label: `${channel.course.duration} min` },
                  ].map(({ icon, label }) => (
                    <View key={icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Ionicons name={icon as any} size={13} color="#006A75" />
                      <Text style={{ color: '#334155', fontSize: 13, fontWeight: '500' }}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Booking row */}
              {bookingDate && (
                <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ECFDF5' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ gap: 3 }}>
                      <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sesión confirmada</Text>
                      <Text style={{ color: '#065F46', fontWeight: '700', fontSize: 15, textTransform: 'capitalize' }}>{bookingDate}</Text>
                      <Text style={{ color: '#047857', fontSize: 13, fontWeight: '500' }}>{bookingTime} · {channel.course.duration} min</Text>
                    </View>
                    <TouchableOpacity onPress={onReschedule} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#D1FAE5', borderRadius: 12, marginTop: 2 }}>
                      <Text style={{ color: '#065F46', fontWeight: '700', fontSize: 12 }}>Reagendar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Expiry warning */}
          {expiresAt && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', marginBottom: 12 }}>
              <Ionicons name="time-outline" size={16} color="#D97706" />
              <Text style={{ color: '#92400E', fontSize: 13, fontWeight: '500', flex: 1 }}>{expiresAt}</Text>
            </View>
          )}

          {/* Close */}
          <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingVertical: 14, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ color: '#64748B', fontWeight: '600', fontSize: 14 }}>Cerrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  return (
    <View className={`mb-2 px-4 max-w-[80%] ${msg.fromMe ? 'self-end items-end' : 'self-start items-start'}`}>
      <View className={`px-4 py-2.5 rounded-2xl ${msg.fromMe ? 'bg-primary rounded-tr-sm' : 'bg-white border border-border rounded-tl-sm'}`}>
        <Text className={`text-sm leading-5 ${msg.fromMe ? 'text-white' : 'text-text-primary'}`}>
          {msg.content}
        </Text>
      </View>
      <Text className="text-xs text-text-muted mt-1">
        {new Date(msg.sentAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </Text>
    </View>
  );
}

// ── Chat view ─────────────────────────────────────────────────────────────────

function ChatView({
  channel,
  onBack,
}: {
  channel: Channel;
  onBack: () => void;
}) {
  const { get } = useApiRequest();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const name = `${channel.otherUser.firstName} ${channel.otherUser.lastName}`;

  // Load history on open
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
      // Avoid duplicates (optimistic vs server echo)
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

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const bookingDate = channel.booking?.startTime
    ? new Date(channel.booking.startTime).toLocaleDateString('es-CO', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
    : null;
  const bookingTime = channel.booking?.startTime
    ? new Date(channel.booking.startTime).toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
    : null;

  const expiryLabel = (() => {
    if (!channel.expiresAt) return null;
    const remaining = new Date(channel.expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'Chat expirado';
    const hours = Math.floor(remaining / 3_600_000);
    return `Expira en ${hours}h · Reserva para continuar`;
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>

        {/* Row 1: back + avatar + name + online dot */}
        <View className="flex-row items-center px-4 pt-3 pb-3 gap-3">
          <TouchableOpacity onPress={onBack} className="p-1 -ml-1">
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          {/* Avatar */}
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 42, height: 42, backgroundColor: avatarColor(name) }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Name + status */}
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base leading-tight">{name}</Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View
                style={{
                  width: 7, height: 7, borderRadius: 4,
                  backgroundColor: connected ? '#22C55E' : '#CBD5E1',
                }}
              />
              <Text style={{ fontSize: 11, color: connected ? '#16A34A' : '#94A3B8' }}>
                {connected ? 'En línea' : 'Desconectado'}
              </Text>
            </View>
          </View>
        </View>

        {/* Row 2: course card */}
        {channel.course && (
          <View
            className="mx-4 mb-3 rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4' }}
          >
            {/* Course title row */}
            <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
              <View className="flex-row items-center gap-2 flex-1 min-w-0">
                <View
                  className="items-center justify-center rounded-lg"
                  style={{ width: 28, height: 28, backgroundColor: '#CCFBF1' }}
                >
                  <Ionicons name="book-outline" size={14} color="#0D9488" />
                </View>
                <Text
                  className="font-bold flex-1"
                  style={{ color: '#0F172A', fontSize: 14 }}
                  numberOfLines={1}
                >
                  {channel.course.subject}
                </Text>
              </View>
              {channel.booking && (
                <TouchableOpacity
                  onPress={() => router.push(`/(learner)/booking/${channel.course!.id}` as any)}
                  style={{
                    marginLeft: 8, paddingHorizontal: 10, paddingVertical: 4,
                    backgroundColor: '#CCFBF1', borderRadius: 20,
                  }}
                >
                  <Text style={{ color: '#0D9488', fontSize: 11, fontWeight: '700' }}>
                    Reagendar
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Price · modalidad · duration chips */}
            <View className="flex-row flex-wrap gap-1.5 px-4 pb-2">
              {[
                `$${channel.course.price.toLocaleString('es-CO')}`,
                channel.course.modalidad,
                `${channel.course.duration} min`,
              ].map((chip) => (
                <View
                  key={chip}
                  style={{
                    paddingHorizontal: 8, paddingVertical: 2,
                    backgroundColor: '#E0F2FE', borderRadius: 99,
                  }}
                >
                  <Text style={{ color: '#0369A1', fontSize: 11, fontWeight: '600' }}>{chip}</Text>
                </View>
              ))}
            </View>

            {/* Booking date row */}
            {bookingDate && (
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 16, paddingVertical: 8,
                  borderTopWidth: 1, borderTopColor: '#99F6E4',
                  backgroundColor: '#ECFDF5',
                }}
              >
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="calendar-outline" size={13} color="#059669" />
                  <Text style={{ color: '#047857', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>
                    {bookingDate}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>·</Text>
                  <Text style={{ color: '#047857', fontSize: 12, fontWeight: '600' }}>
                    {bookingTime}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 8, paddingVertical: 3,
                    backgroundColor: '#D1FAE5', borderRadius: 99,
                  }}
                >
                  <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 }}>
                    CONFIRMADA
                  </Text>
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

      {/* KAV wraps only the scrollable content + input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
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

        {/* Input — bottom inset keeps it above the home indicator */}
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
            className={`w-10 h-10 rounded-full items-center justify-center ${text.trim() && connected ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <Ionicons name="send" size={18} color={text.trim() && connected ? 'white' : '#94A3B8'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

/**
 * Shared messaging screen used by both learner and tutor tabs.
 * Renders a channel list; selecting a channel opens the real-time chat view.
 *
 * @author TutorConnect Team
 */
export function MensajesScreen() {
  const { get } = useApiRequest();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    const res = await get<Channel[]>(API_ENDPOINTS.messagingChannels);
    if (Array.isArray(res.data)) setChannels(res.data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void loadChannels(); }, [loadChannels]));

  if (activeChannel) {
    return <ChatView channel={activeChannel} onBack={() => setActiveChannel(null)} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-3 border-b border-border">
        <Text className="text-2xl font-bold text-text-primary">Mensajes</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#006A75" />
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => (
            <ChannelItem channel={item} onPress={() => setActiveChannel(item)} />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6 pt-24">
              <Ionicons name="chatbubbles-outline" size={52} color="#CBD5E1" />
              <Text className="text-text-primary font-semibold text-lg mt-4">Sin conversaciones</Text>
              <Text className="text-text-muted text-sm text-center mt-2 leading-5">
                Aquí aparecerán tus chats con tutores al confirmar una sesión.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
