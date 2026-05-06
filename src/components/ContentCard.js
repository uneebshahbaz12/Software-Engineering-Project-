import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ContentCard({ item, onPress, style, width = SIZES.cardWidth, height = SIZES.cardHeight, index = 0 }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[animatedStyle, styles.container, { width }, style]}
      activeOpacity={0.9}
    >
      <View style={[styles.imageWrapper, { height }]}>
        <Image source={(item.thumbnail || item.cover) ? { uri: item.thumbnail || item.cover } : require('../../assets/icon.png')} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        />

        {/* Rating badge */}
        {item.rating && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={9} color={COLORS.goldLight} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        )}

        {(item.isNew || item.is_new) && (
          <View style={styles.newBadge}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.newBadgeGradient}
            >
              <Text style={styles.newBadgeText}>NEW</Text>
            </LinearGradient>
          </View>
        )}

        {(item.isTrending || item.is_trending) && !(item.isNew || item.is_new) && (
          <View style={styles.newBadge}>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={9} color="#FFF" />
              <Text style={styles.newBadgeText}>HOT</Text>
            </View>
          </View>
        )}

        {item.duration && (
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={9} color="#FFF" />
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}

        {/* Views count */}
        {item.views && (
          <View style={styles.viewsBadge}>
            <Ionicons name="eye-outline" size={9} color="#FFF" />
            <Text style={styles.viewsText}>{item.views}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        {(item.scholar || item.scholars) && (
          <View style={styles.scholarRow}>
            <View style={styles.scholarDot} />
            <Text style={styles.scholar}>{item.scholar || item.scholars?.name}</Text>
          </View>
        )}
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: SIZES.spacing_md,
    borderRadius: SIZES.radius_md,
    backgroundColor: COLORS.backgroundCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: SIZES.radius_md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: COLORS.goldLight,
    fontSize: 9,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  newBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '600',
  },
  viewsBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '500',
  },
  info: {
    padding: SIZES.spacing_sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: SIZES.sm,
    fontWeight: '600',
    lineHeight: 17,
  },
  scholarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  scholarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  scholar: {
    color: COLORS.textSecondary,
    fontSize: SIZES.xs,
  },
});
