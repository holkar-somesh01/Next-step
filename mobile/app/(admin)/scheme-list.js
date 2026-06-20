import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetSchemesQuery } from '../../redux/api/schemeApi';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminSchemeList() {
  const router = useRouter();
  const { isDark: dark, colors: c } = useTheme();
  
  const { data: schemes, isLoading, refetch } = useGetSchemesQuery();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Modern Header Banner */}
      <LinearGradient
        colors={dark ? ['#1e1b4b', '#0f172a'] : ['#1E3A8A', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Educational Schemes</Text>
          <View style={styles.placeholderButton} />
        </View>
        <Text style={styles.headerSubtext}>Manage and view all published schemes</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dark ? "#818CF8" : "#2563EB"} />
        }
      >
        <View style={styles.listContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={dark ? '#A5B4FC' : '#2563EB'} style={{ marginTop: 50 }} />
          ) : schemes && schemes.length > 0 ? (
            schemes.map((item) => (
              <TouchableOpacity 
                key={item._id} 
                onPress={() => router.push(`/(admin)/scheme-details?id=${item._id}`)}
                style={[styles.feedCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
                activeOpacity={0.7}
              >
                <View style={styles.feedCardHeader}>
                  <View style={[styles.tagWrapper, { backgroundColor: dark ? '#2e2b54' : '#EEF2FF' }]}>
                    <Text style={[styles.tagText, { color: dark ? '#A5B4FC' : '#4F46E5' }]}>{item.category || 'General'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={c.subText} />
                </View>
                <Text style={[styles.feedCardTitle, { color: c.text }]}>{item.name}</Text>
                <Text style={[styles.feedCardDesc, { color: c.subText }]} numberOfLines={2}>{item.description}</Text>
                {item.deadline && (
                  <View style={styles.feedCardFooter}>
                    <Ionicons name="calendar-outline" size={13} color={c.subText} />
                    <Text style={[styles.feedCardFooterText, { color: c.subText }]}>Deadline: {item.deadline}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={54} color={c.subText} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyStateText, { color: c.text }]}>No schemes found.</Text>
              <Text style={[styles.emptyStateSubtext, { color: c.subText }]}>Click the + button below to create one.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button for adding scheme */}
      <TouchableOpacity
        onPress={() => router.push('/(admin)/schemes')}
        style={[styles.fab, { backgroundColor: dark ? '#818CF8' : '#2563EB' }]}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
    paddingTop: 24,
  },
  feedCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  feedCardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  feedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  feedCardFooterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
