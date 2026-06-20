import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetContactsQuery } from '../../redux/api/contactApi';
import { useTheme } from '../../context/ThemeContext';

export default function AdminContactsScreen() {
  const router = useRouter();
  const { isDark: dark, colors: c } = useTheme();
  const { data: contacts, isLoading, refetch } = useGetContactsQuery();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts?.filter(contact => 
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.message?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading && !contacts) {
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
        <Text style={[styles.headerTitle, { color: c.text }]}>Contact Inquiries</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Ionicons name="search-outline" size={18} color={c.subText} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Search inquiries..."
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
        data={filteredContacts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.inquiryCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={styles.senderInfo}>
                <View style={[styles.avatar, { backgroundColor: dark ? '#38220f' : '#FFF7ED' }]}>
                  <Ionicons name="mail-outline" size={20} color={dark ? '#FDBA74' : '#EA580C'} />
                </View>
                <View style={styles.senderDetails}>
                  <Text style={[styles.senderName, { color: c.text }]}>{item.name}</Text>
                  <Text style={[styles.senderEmail, { color: c.subText }]}>{item.email}</Text>
                </View>
              </View>
              <Text style={[styles.dateText, { color: c.subText }]}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.rowBorder }]} />
            <Text style={[styles.subject, { color: dark ? '#A5B4FC' : '#2563EB' }]}>{item.subject}</Text>
            <Text style={[styles.message, { color: c.text }]}>{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={c.subText} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyStateText, { color: c.subText }]}>
              {searchQuery ? "No matching inquiries found" : "No inquiries found"}
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
  inquiryCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderDetails: {
    marginLeft: 12,
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
  },
  senderEmail: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  subject: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
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
