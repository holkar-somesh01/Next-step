import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetUsersQuery } from '../../redux/api/userApi';
import { useTheme } from '../../context/ThemeContext';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { isDark: dark, colors: c } = useTheme();
  const { data: users, isLoading, refetch } = useGetUsersQuery();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading && !users) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={dark ? "#818CF8" : "#2563EB"} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.rowBorder, backgroundColor: c.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Manage Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Ionicons name="search-outline" size={18} color={c.subText} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Search by name, email, or role..."
            placeholderTextColor={c.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={c.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.userCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? (dark ? '#521b1b' : '#FEF2F2') : (dark ? '#1e2b54' : '#EEF2FF') }]}>
              <Ionicons 
                name={item.role === 'admin' ? "shield-checkmark-outline" : "person-outline"} 
                size={22} 
                color={item.role === 'admin' ? '#EF4444' : (dark ? '#A5B4FC' : '#4F46E5')} 
              />
            </View>
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={[styles.userName, { color: c.text }]}>{item.name}</Text>
                <View style={[
                  styles.roleBadge, 
                  { backgroundColor: item.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)' }
                ]}>
                  <Text style={[
                    styles.roleBadgeText, 
                    { color: item.role === 'admin' ? '#EF4444' : (dark ? '#A5B4FC' : '#4F46E5') }
                  ]}>
                    {item.role.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.userEmail, { color: c.subText }]}>{item.email}</Text>
              {item.mobile && (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={12} color={c.subText} />
                  <Text style={[styles.userPhone, { color: c.subText }]}>{item.mobile}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={c.subText} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyStateText, { color: c.subText }]}>
              {searchQuery ? "No matching users found" : "No registered users found"}
            </Text>
          </View>
        )}
        onRefresh={refetch}
        refreshing={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  userPhone: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
