import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

export default function SectionHeader({ title, onSeeAll, showSeeAll = true, icon, iconColor }) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {icon && (
          <View style={[styles.titleIcon, { backgroundColor: (iconColor || COLORS.primary) + '15' }]}>
            <Ionicons name={icon} size={14} color={iconColor || COLORS.primary} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      {showSeeAll && onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAll}>
          <Text style={styles.seeAllText}>See All</Text>
          <View style={styles.seeAllArrow}>
            <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing_base,
    marginBottom: SIZES.spacing_md,
    marginTop: SIZES.spacing_xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  seeAllArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
