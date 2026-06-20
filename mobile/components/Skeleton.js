import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function Skeleton({ width, height, borderRadius = 8, style }) {
  const { isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const skeletonBg = isDark ? '#252540' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: skeletonBg,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function SchemeCardSkeleton() {
  const { colors: c } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      {/* Category Tag Placeholder */}
      <Skeleton width={80} height={18} borderRadius={10} style={{ marginBottom: 12 }} />

      {/* Title Placeholders */}
      <Skeleton width="85%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width="50%" height={18} borderRadius={6} style={{ marginBottom: 16 }} />

      {/* Description Placeholders */}
      <Skeleton width="100%" height={13} borderRadius={5} style={{ marginBottom: 7 }} />
      <Skeleton width="75%" height={13} borderRadius={5} style={{ marginBottom: 18 }} />

      {/* Footer Placeholder */}
      <View style={styles.cardFooter}>
        <View style={styles.deadlineRow}>
          <Skeleton width={16} height={16} borderRadius={8} />
          <Skeleton width={90} height={14} borderRadius={4} />
        </View>
        <Skeleton width={75} height={32} borderRadius={10} />
      </View>
    </View>
  );
}

export function ContactRowSkeleton() {
  const { colors: c } = useTheme();

  return (
    <View style={[styles.contactRow, { borderBottomColor: c.cardBorder }]}>
      {/* Avatar Circle */}
      <Skeleton width={52} height={52} borderRadius={26} />

      {/* Info Column */}
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.contactTopRow}>
          <Skeleton width={110} height={15} borderRadius={5} />
          <Skeleton width={45} height={11} borderRadius={4} />
        </View>
        <Skeleton width="75%" height={13} borderRadius={4} />
      </View>
    </View>
  );
}

export function TableRowSkeleton({ isEven }) {
  return (
    <View 
      style={[
        styles.tableRow,
        { 
          backgroundColor: isEven ? '#FFFFFF' : '#F8FAFC',
        }
      ]}
    >
      <View style={{ width: 160, paddingRight: 16 }}>
        <Skeleton width={120} height={15} borderRadius={4} />
      </View>
      <View style={{ width: 240, paddingRight: 16, gap: 6 }}>
        <Skeleton width="100%" height={12} borderRadius={4} />
        <Skeleton width="60%" height={12} borderRadius={4} />
      </View>
      <View style={{ width: 200, paddingRight: 16 }}>
        <Skeleton width={140} height={14} borderRadius={4} />
      </View>
      <View style={{ width: 128, alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton width={68} height={28} borderRadius={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  contactTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
});
