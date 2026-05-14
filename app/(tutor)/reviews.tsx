/**
 * Full reviews screen for the authenticated tutor.
 * Shows aggregate rating stats and all received reviews.
 *
 * @author TutorConnect Team
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTutorReviews } from '@/hooks/use-tutor-reviews';
import type { RecentReview } from '@/hooks/use-tutor-reviews';

// ── Sub-components ────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= rating ? 'star' : 'star-outline'}
          size={13}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: RecentReview }) {
  const date = new Date(review.createdAt).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View className="bg-white border border-border rounded-2xl p-4 mb-3 mx-6">
      <View className="flex-row items-start justify-between mb-1">
        <Text className="text-text-primary font-semibold text-sm flex-1">{review.learnerName}</Text>
        <Stars rating={review.rating} />
      </View>
      <Text className="text-text-muted text-xs mb-2">{review.subject} · {date}</Text>
      {review.comment ? (
        <Text className="text-text-primary text-sm leading-5">{review.comment}</Text>
      ) : null}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TutorReviewsScreen() {
  const router = useRouter();
  const { data, loading, error } = useTutorReviews();

  const maxCount = data
    ? Math.max(...Object.values(data.ratingDistribution), 1)
    : 1;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top bar */}
      <View className="flex-row items-center px-4 py-2 gap-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-text-primary flex-1">Mis reseñas</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#006A75" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
          <Text className="text-red-700 text-sm text-center mt-3">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={data?.recentReviews ?? []}
          keyExtractor={(r) => String(r.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            <View className="mx-6 mt-5 mb-5 bg-white border border-border rounded-2xl p-5">
              {/* Average */}
              <View className="flex-row gap-4 mb-4">
                <View className="items-center justify-center">
                  <Text className="text-4xl font-bold text-text-primary">
                    {(data?.averageRating ?? 0).toFixed(1)}
                  </Text>
                  <Stars rating={Math.round(data?.averageRating ?? 0)} />
                  <Text className="text-text-muted text-xs mt-1">
                    {data?.totalReviews ?? 0} reseñas
                  </Text>
                </View>

                {/* Distribution bars */}
                <View className="flex-1 gap-1.5 justify-center">
                  {(['5', '4', '3', '2', '1'] as const).map((star) => {
                    const count = data?.ratingDistribution[star] ?? 0;
                    const pct = data && data.totalReviews > 0
                      ? (count / maxCount) * 100
                      : 0;
                    return (
                      <View key={star} className="flex-row items-center gap-2">
                        <Text className="text-text-muted text-xs w-3">{star}</Text>
                        <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <View
                            className="h-2 bg-amber-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </View>
                        <Text className="text-text-muted text-xs w-3">{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => <ReviewCard review={item} />}
          ListEmptyComponent={
            <View className="mx-6 bg-white border border-dashed border-border rounded-2xl p-8 items-center">
              <Ionicons name="star-outline" size={36} color="#CBD5E1" />
              <Text className="text-text-muted text-sm text-center mt-3 leading-5">
                Aún no tienes reseñas.{'\n'}Completa sesiones para recibirlas.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
