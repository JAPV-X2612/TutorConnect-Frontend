import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSessionReview } from '@/hooks/use-session-review';

const STAR_FILLED = '#F59E0B';
const STAR_EMPTY = '#CBD5E1';
const COMMENT_MAX_LENGTH = 1000;

const RATING_LABELS: Record<number, string> = {
  1: 'Muy mala',
  2: 'Mala',
  3: 'Aceptable',
  4: 'Buena',
  5: 'Excelente',
};

interface RateSessionModalProps {
  visible: boolean;
  bookingId: string | null;
  tutorName?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

/**
 * Bottom-sheet style modal that lets a learner rate a completed session with
 * 1-5 stars and an optional free-text comment.
 *
 * Behaviour:
 * - On open, the hook fetches any existing review for the booking. If found,
 *   the modal renders the read-only "ya calificada" view.
 * - If no prior review exists, the user picks a rating (required) and may
 *   optionally add a comment up to {@link COMMENT_MAX_LENGTH} characters.
 * - On successful submit the modal calls onSubmitted and closes itself.
 *
 * @author TutorConnect Team
 */
export function RateSessionModal({
  visible,
  bookingId,
  tutorName,
  onClose,
  onSubmitted,
}: RateSessionModalProps) {
  const {
    existingReview,
    loading,
    submitting,
    error,
    fetchExisting,
    submit,
    reset,
  } = useSessionReview(bookingId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (visible && bookingId) {
      void fetchExisting();
    }
    if (!visible) {
      setRating(0);
      setComment('');
      reset();
    }
  }, [visible, bookingId, fetchExisting, reset]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    const result = await submit(rating, comment);
    if (result.success) {
      onSubmitted?.();
      onClose();
    }
  };

  const isReadOnly = existingReview !== null;
  const displayedRating = isReadOnly ? existingReview.rating : rating;
  const canSubmit = !submitting && !loading && rating > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl p-6 pb-8">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-text-primary font-bold text-lg">
                {isReadOnly ? 'Tu calificación' : 'Califica tu sesión'}
              </Text>
              {tutorName ? (
                <Text className="text-text-muted text-sm mt-0.5">
                  con {tutorName}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Cerrar"
              hitSlop={8}>
              <Ionicons name="close" size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#006A75" />
            </View>
          ) : (
            <>
              {/* Stars */}
              <View className="flex-row justify-center gap-2 my-6">
                {[1, 2, 3, 4, 5].map((value) => {
                  const filled = value <= displayedRating;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => !isReadOnly && setRating(value)}
                      activeOpacity={isReadOnly ? 1 : 0.7}
                      disabled={isReadOnly || submitting}
                      accessibilityLabel={`${value} estrella${value > 1 ? 's' : ''}`}
                      hitSlop={6}>
                      <Ionicons
                        name={filled ? 'star' : 'star-outline'}
                        size={42}
                        color={filled ? STAR_FILLED : STAR_EMPTY}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {displayedRating > 0 ? (
                <Text className="text-center text-text-muted text-sm -mt-2 mb-4">
                  {RATING_LABELS[displayedRating]}
                </Text>
              ) : (
                <Text className="text-center text-text-subtle text-sm -mt-2 mb-4">
                  Toca una estrella para calificar
                </Text>
              )}

              {/* Comment */}
              {isReadOnly ? (
                existingReview.comment ? (
                  <View className="bg-secondary/30 rounded-xl p-3 mb-4">
                    <Text className="text-text-secondary text-sm italic">
                      “{existingReview.comment}”
                    </Text>
                  </View>
                ) : null
              ) : (
                <View className="mb-4">
                  <Text className="text-text-muted text-xs mb-1.5">
                    Comentario (opcional)
                  </Text>
                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Cuéntanos cómo te fue…"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    maxLength={COMMENT_MAX_LENGTH}
                    editable={!submitting}
                    className="border border-border rounded-xl p-3 text-text-primary text-sm min-h-[72px]"
                    style={{ textAlignVertical: 'top' }}
                  />
                  <Text className="text-text-subtle text-xs mt-1 text-right">
                    {comment.length}/{COMMENT_MAX_LENGTH}
                  </Text>
                </View>
              )}

              {/* Error */}
              {error ? (
                <Text className="text-red-600 text-sm text-center mb-3">
                  {error}
                </Text>
              ) : null}

              {/* Actions */}
              {isReadOnly ? (
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.8}
                  className="bg-primary rounded-full py-3 items-center">
                  <Text className="text-primary-foreground font-semibold">
                    Cerrar
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.8}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-full border border-border items-center">
                    <Text className="text-text-muted font-semibold">
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    disabled={!canSubmit}
                    className={`flex-1 py-3 rounded-full items-center ${
                      canSubmit ? 'bg-primary' : 'bg-secondary'
                    }`}>
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text
                        className={`font-semibold ${
                          canSubmit
                            ? 'text-primary-foreground'
                            : 'text-secondary-foreground'
                        }`}>
                        Enviar
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
