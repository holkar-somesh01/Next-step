import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useGetSchemesQuery, useDeleteSchemeMutation } from '../../redux/api/schemeApi';
import { useGetUsersQuery } from '../../redux/api/userApi';
import { useGetContactsQuery } from '../../redux/api/contactApi';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isDark: dark, colors: c, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);

  const { data: schemes, isLoading: schemesLoading, refetch: refetchSchemes } = useGetSchemesQuery();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useGetUsersQuery();
  const { data: contacts, isLoading: contactsLoading, refetch: refetchContacts } = useGetContactsQuery();

  const [deleteScheme] = useDeleteSchemeMutation();
  const [activeTab, setActiveTab] = useState('schemes'); // 'schemes' | 'contacts'
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSchemes(), refetchUsers(), refetchContacts()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const handleDeleteScheme = (id) => {
    Alert.alert(
      'Delete Scheme',
      'Are you sure you want to delete this scheme?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScheme(id).unwrap();
            } catch (_err) {
              Alert.alert('Error', 'Failed to delete scheme');
            }
          }
        }
      ]
    );
  };

  // Get recent 3 items
  const recentSchemes = schemes ? [...schemes].slice(-3).reverse() : [];
  const recentContacts = contacts ? [...contacts].slice(-3).reverse() : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dark ? "#818CF8" : "#2563EB"} />
        }
      >
        {/* Modern Header Banner */}
        <LinearGradient
          colors={dark ? ['#1e1b4b', '#0f172a'] : ['#1E3A8A', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name || 'Admin')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.adminInfo}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.adminName} numberOfLines={1}>{user?.name || 'Administrator'}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
                <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={[styles.iconButton, styles.logoutButton]}>
                <Ionicons name="power" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerSubtext}>Manage Next Step Education Portal</Text>
        </LinearGradient>

        {/* Dashboard Stats Board */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Dashboard Stats</Text>
          <View style={styles.statsGrid}>
            {/* Schemes Stat */}
            <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={[styles.statIconWrapper, { backgroundColor: dark ? '#2e2b54' : '#EEF2FF' }]}>
                <Ionicons name="school-outline" size={20} color={dark ? '#A5B4FC' : '#4F46E5'} />
              </View>
              <View style={styles.statContent}>
                {schemesLoading ? (
                  <ActivityIndicator size="small" color={dark ? '#A5B4FC' : '#4F46E5'} style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={[styles.statNumber, { color: c.text }]}>{schemes?.length || 0}</Text>
                )}
                <Text style={[styles.statLabel, { color: c.subText }]}>Schemes</Text>
              </View>
            </View>

            {/* Users Stat */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/users')}
              style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            >
              <View style={[styles.statIconWrapper, { backgroundColor: dark ? '#064e3b' : '#ECFDF5' }]}>
                <Ionicons name="people-outline" size={20} color={dark ? '#6EE7B7' : '#059669'} />
              </View>
              <View style={styles.statContent}>
                {usersLoading ? (
                  <ActivityIndicator size="small" color={dark ? '#6EE7B7' : '#059669'} style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={[styles.statNumber, { color: c.text }]}>{users?.length || 0}</Text>
                )}
                <Text style={[styles.statLabel, { color: c.subText }]}>Users</Text>
              </View>
            </TouchableOpacity>

            {/* Inquiries Stat */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/contacts')}
              style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            >
              <View style={[styles.statIconWrapper, { backgroundColor: dark ? '#7c2d12' : '#FFF7ED' }]}>
                <Ionicons name="chatbubbles-outline" size={20} color={dark ? '#FDBA74' : '#EA580C'} />
              </View>
              <View style={styles.statContent}>
                {contactsLoading ? (
                  <ActivityIndicator size="small" color={dark ? '#FDBA74' : '#EA580C'} style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={[styles.statNumber, { color: c.text }]}>{contacts?.length || 0}</Text>
                )}
                <Text style={[styles.statLabel, { color: c.subText }]}>Inquiries</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions Hub */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/schemes')}
              style={[styles.actionButtonCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            >
              <LinearGradient colors={['#818CF8', '#4F46E5']} style={styles.actionIconContainer}>
                <Ionicons name="add-circle" size={22} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionButtonText, { color: c.text }]}>Create Scheme</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/(admin)/users')}
              style={[styles.actionButtonCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            >
              <LinearGradient colors={['#34D399', '#059669']} style={styles.actionIconContainer}>
                <Ionicons name="people" size={22} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionButtonText, { color: c.text }]}>Manage Users</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/(admin)/contacts')}
              style={[styles.actionButtonCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            >
              <LinearGradient colors={['#FDBA74', '#EA580C']} style={styles.actionIconContainer}>
                <Ionicons name="mail" size={22} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionButtonText, { color: c.text }]}>View Inquiries</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabbed Feed Section */}
        <View style={styles.sectionContainer}>
          <View style={[styles.tabHeader, { borderBottomColor: c.rowBorder }]}>
            <TouchableOpacity 
              onPress={() => setActiveTab('schemes')}
              style={[
                styles.tabButton, 
                activeTab === 'schemes' && { borderBottomColor: dark ? '#818CF8' : '#2563EB' }
              ]}
            >
              <Text style={[
                styles.tabButtonText, 
                { color: activeTab === 'schemes' ? (dark ? '#818CF8' : '#2563EB') : c.subText },
                activeTab === 'schemes' && styles.tabButtonTextActive
              ]}>
                Recent Schemes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setActiveTab('contacts')}
              style={[
                styles.tabButton, 
                activeTab === 'contacts' && { borderBottomColor: dark ? '#818CF8' : '#2563EB' }
              ]}
            >
              <Text style={[
                styles.tabButtonText, 
                { color: activeTab === 'contacts' ? (dark ? '#818CF8' : '#2563EB') : c.subText },
                activeTab === 'contacts' && styles.tabButtonTextActive
              ]}>
                Recent Inquiries
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'schemes' ? (
            <View style={styles.tabContent}>
              {recentSchemes.length > 0 ? (
                <>
                  {recentSchemes.map((item) => (
                    <TouchableOpacity 
                      key={item._id} 
                      onPress={() => router.push(`/(admin)/scheme-details?id=${item._id}`)}
                      style={[styles.feedCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
                      activeOpacity={0.8}
                    >
                      <View style={styles.feedCardHeader}>
                        <View style={[styles.tagWrapper, { backgroundColor: dark ? '#2e2b54' : '#EEF2FF' }]}>
                          <Text style={[styles.tagText, { color: dark ? '#A5B4FC' : '#4F46E5' }]}>{item.category || 'General'}</Text>
                        </View>
                        <View style={styles.feedCardActions}>
                          <TouchableOpacity 
                            onPress={() => router.push({ pathname: '/(admin)/schemes', params: { id: item._id, edit: true } })}
                            style={[styles.miniButton, { backgroundColor: dark ? '#252540' : '#EFF6FF' }]}
                          >
                            <Ionicons name="pencil" size={15} color={dark ? '#A5B4FC' : '#2563EB'} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleDeleteScheme(item._id)}
                            style={[styles.miniButton, { backgroundColor: dark ? '#521b1b' : '#FEF2F2' }]}
                          >
                            <Ionicons name="trash-outline" size={15} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
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
                  ))}
                  <TouchableOpacity 
                    onPress={() => router.push('/(admin)/scheme-list')}
                    style={[styles.viewAllButton, { backgroundColor: dark ? '#2e2b54' : '#EEF2FF' }]}
                  >
                    <Text style={[styles.viewAllText, { color: dark ? '#A5B4FC' : '#4F46E5' }]}>View All Schemes</Text>
                    <Ionicons name="arrow-forward" size={16} color={dark ? '#A5B4FC' : '#4F46E5'} />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={44} color={c.subText} style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyStateText, { color: c.subText }]}>No educational schemes available.</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {recentContacts.length > 0 ? (
                recentContacts.map((item) => (
                  <View key={item._id} style={[styles.feedCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                    <View style={styles.feedCardHeader}>
                      <View style={styles.userInfoWrapper}>
                        <Ionicons name="person-circle-outline" size={24} color={c.subText} />
                        <View style={{ marginLeft: 6, flex: 1 }}>
                          <Text style={[styles.userCardName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
                          <Text style={[styles.userCardEmail, { color: c.subText }]} numberOfLines={1}>{item.email}</Text>
                        </View>
                      </View>
                      <Text style={[styles.dateText, { color: c.subText }]}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={[styles.feedCardTitle, { color: c.text, marginTop: 10, fontSize: 15 }]}>{item.subject}</Text>
                    <Text style={[styles.feedCardDesc, { color: c.subText }]} numberOfLines={2}>{item.message}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="mail-open-outline" size={44} color={c.subText} style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyStateText, { color: c.subText }]}>No inquiries received yet.</Text>
                </View>
              )}
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 36,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  adminInfo: {
    marginLeft: 12,
    flex: 1,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  adminName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  headerSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 20,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  statIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statContent: {
    width: '100%',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    marginBottom: 16,
  },
  tabButton: {
    paddingBottom: 10,
    marginRight: 24,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    fontWeight: '700',
  },
  tabContent: {
    gap: 12,
  },
  feedCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  tagWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  feedCardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  miniButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  feedCardDesc: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 4,
  },
  feedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  feedCardFooterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  userInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  userCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  userCardEmail: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 8,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
