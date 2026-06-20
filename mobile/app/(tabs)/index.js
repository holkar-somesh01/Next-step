import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Switch,
  Animated,
  Pressable,
  Image,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetSchemesQuery } from '../../redux/api/schemeApi';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logout, setChatUnlocked } from '../../redux/slices/authSlice';
import { useRouter } from 'expo-router';
import { useVerifySecretCodeMutation } from '../../redux/api/userApi';
import { useTheme } from '../../context/ThemeContext';
import { SchemeCardSkeleton } from '../../components/Skeleton';

export default function HomeScreen() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const router = useRouter();
  const { isDark, toggleTheme, colors: c } = useTheme();
  const { data: schemes, isLoading, isFetching, refetch } = useGetSchemesQuery();
  const [searchText, setSearchText] = useState('');
  const [isChatUnlocked, setIsChatUnlocked] = useState(false);
  const [verifySecretCode] = useVerifySecretCodeMutation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const profileImageUri = user?.profileImage ? `${BASE_URL}${user.profileImage}` : null;

  const sidebarAnim = useRef(new Animated.Value(-280)).current;

  const toggleSidebar = (open) => {
    if (open) {
      setIsSidebarOpen(true);
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: -280,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setIsSidebarOpen(false));
    }
  };

  const handleLogout = () => {
    toggleSidebar(false);
    const performLogout = () => {
      dispatch(logout());
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        performLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };



  const handleSearchChange = async (text) => {
    setSearchText(text);
    const targetLength = user?.secretCodeLength || 6;
    if (text.length >= targetLength) {
      try {
        await verifySecretCode({ code: text }).unwrap();
        setIsChatUnlocked(true);
        dispatch(setChatUnlocked(true));
        setSearchText('');
      } catch {
        setIsChatUnlocked(false);
        dispatch(setChatUnlocked(false));
      }
    } else {
      setIsChatUnlocked(false);
      dispatch(setChatUnlocked(false));
    }
  };

  const filteredSchemes = schemes?.filter((s) =>
    s.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <FlatList
        data={isLoading ? [1, 2, 3] : filteredSchemes}
        keyExtractor={(item, index) => isLoading ? `skeleton-${index}` : item._id}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isFetching && !isLoading}
        ListHeaderComponent={
          <>
            {/* ── Gradient Header ── */}
            <LinearGradient
              colors={isDark ? ['#1a1a2e', '#16213e'] : ['#1E3A8A', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              {/* Top Navigation Row */}
              <View style={styles.headerTop}>
                <View style={styles.brandHeader}>
                  <TouchableOpacity onPress={() => toggleSidebar(true)} style={{ marginRight: 12 }}>
                    <Ionicons name="menu-outline" size={28} color="#fff" />
                  </TouchableOpacity>
                  <Ionicons name="school" size={24} color="#fff" />
                  <Text style={styles.brandTitle}>Next Step</Text>
                </View>

                {/* Profile icon */}
                <View style={styles.headerRight}>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                    <Ionicons name="person-circle-outline" size={32} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Bar */}
              <View style={[styles.searchBar, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)',
              }]}>
                <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.7)" />
                <TextInput
                  placeholder="Search for schemes..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={handleSearchChange}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>

            {/* ── Chat Unlock Banner ── */}
            {isChatUnlocked && (
              <TouchableOpacity
                onPress={() => router.push('/chats')}
                activeOpacity={0.85}
                style={[styles.chatBanner, { backgroundColor: isDark ? '#1d4ed8' : '#2563EB' }]}
              >
                <View style={styles.chatBannerIcon}>
                  <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatBannerTitle}>Chats Unlocked!</Text>
                  <Text style={styles.chatBannerSub}>Start a private conversation</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            )}

            {/* ── Section Heading ── */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Latest Schemes</Text>
                <View style={styles.sectionUnderline} />
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => {
          if (isLoading) {
            return <SchemeCardSkeleton />;
          }
          return (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push(`/scheme/${item._id}`)}
              style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            >
              <View style={[styles.tag, {
                backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : '#EFF6FF',
              }]}>
                <Text style={styles.tagText}>{item.category || 'General'}</Text>
              </View>

              <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={2}>
                {item.name}
              </Text>

              <Text style={[styles.cardDesc, { color: c.subText }]} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={[styles.cardFooter, { borderTopColor: c.cardBorder }]}>
                <View style={styles.deadlineRow}>
                  <Ionicons name="calendar-outline" size={14} color={c.subText} />
                  <Text style={[styles.deadlineText, { color: c.subText }]}>
                    {item.deadline || 'No Deadline'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/scheme/${item._id}`)}
                  style={styles.applyBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.applyText}>Details</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => {
          if (isLoading) return null;
          return (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: c.card }]}>
                <Ionicons name="document-text-outline" size={36} color={c.subText} />
              </View>
              <Text style={[styles.emptyText, { color: c.subText }]}>No schemes found</Text>
            </View>
          );
        }}
      />

      {/* ── Sidebar Navigation Overlay ── */}
      {isSidebarOpen && (
        <View style={StyleSheet.absoluteFillObject}>
          {/* Backdrop */}
          <Pressable 
            style={StyleSheet.absoluteFillObject} 
            onPress={() => toggleSidebar(false)}
          >
            <Animated.View 
              style={[
                styles.backdrop, 
                { 
                  opacity: sidebarAnim.interpolate({
                    inputRange: [-280, 0],
                    outputRange: [0, 0.4]
                  }) 
                }
              ]} 
            />
          </Pressable>

          {/* Sidebar Content */}
          <Animated.View 
            style={[
              styles.sidebarContainer, 
              { 
                backgroundColor: c.card, 
                borderColor: c.cardBorder,
                transform: [{ translateX: sidebarAnim }] 
              }
            ]}
          >
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              {/* User Info Header */}
              <View style={[styles.sidebarHeader, { borderBottomColor: c.cardBorder }]}>
                <View style={styles.sidebarAvatarRing}>
                  {profileImageUri ? (
                    <Image source={{ uri: profileImageUri }} style={styles.sidebarAvatarImg} />
                  ) : (
                    <View style={styles.sidebarAvatarFallback}>
                      <Text style={styles.sidebarAvatarInitials}>{initials}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sidebarName, { color: c.text }]}>{user?.name || 'User'}</Text>
                <Text style={[styles.sidebarEmail, { color: c.subText }]} numberOfLines={1}>{user?.email || ''}</Text>
                <View style={[styles.sidebarRoleBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }]}>
                  <Text style={styles.sidebarRoleText}>{user?.role || 'Student'}</Text>
                </View>
              </View>

              {/* Navigation Items */}
              <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
                <TouchableOpacity 
                  style={styles.sidebarNavItem} 
                  onPress={() => { toggleSidebar(false); }}
                >
                  <Ionicons name="home-outline" size={20} color={c.text} />
                  <Text style={[styles.sidebarNavText, { color: c.text }]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sidebarNavItem} 
                  onPress={() => { toggleSidebar(false); router.push('/(tabs)/explore'); }}
                >
                  <Ionicons name="person-outline" size={20} color={c.text} />
                  <Text style={[styles.sidebarNavText, { color: c.text }]}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sidebarNavItem} 
                  onPress={() => { toggleSidebar(false); router.push('/settings'); }}
                >
                  <Ionicons name="settings-outline" size={20} color={c.text} />
                  <Text style={[styles.sidebarNavText, { color: c.text }]}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sidebarNavItem} 
                  onPress={() => { toggleSidebar(false); router.push('/contact'); }}
                >
                  <Ionicons name="help-circle-outline" size={20} color={c.text} />
                  <Text style={[styles.sidebarNavText, { color: c.text }]}>Help & Support</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sidebarNavItem} 
                  onPress={() => { toggleSidebar(false); router.push('/about'); }}
                >
                  <Ionicons name="information-circle-outline" size={20} color={c.text} />
                  <Text style={[styles.sidebarNavText, { color: c.text }]}>About App</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sidebarNavItem} 
                  onPress={() => { toggleSidebar(false); router.push('/privacy'); }}
                >
                  <Ionicons name="shield-checkmark-outline" size={20} color={c.text} />
                  <Text style={[styles.sidebarNavText, { color: c.text }]}>Privacy Policy</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Footer with Logout */}
              <TouchableOpacity 
                style={[styles.sidebarFooter, { borderTopColor: c.cardBorder }]} 
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={styles.sidebarLogoutText}>Logout</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Header */
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20 },
  brandHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  headerName: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.3, textTransform: 'capitalize' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  /* Search */
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },

  /* Chat Banner */
  chatBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 16,
    borderRadius: 18, padding: 16, gap: 12,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  chatBannerIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  chatBannerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  chatBannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  /* Section */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 24, marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionUnderline: {
    width: 28, height: 3, backgroundColor: '#2563EB', borderRadius: 4, marginTop: 4,
  },
  viewAll: { color: '#3B82F6', fontWeight: '700', fontSize: 13 },

  /* Cards */
  card: {
    marginHorizontal: 20, marginBottom: 14,
    borderRadius: 22, padding: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  tagText: { color: '#3B82F6', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, lineHeight: 22 },
  cardDesc: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 14, borderTopWidth: 1,
  },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deadlineText: { fontSize: 12, fontWeight: '500' },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  /* Empty */
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, fontWeight: '500' },

  /* Sidebar styles */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sidebarContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 16,
  },
  sidebarHeader: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  sidebarAvatarRing: {
    padding: 3,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 48,
    marginBottom: 12,
  },
  sidebarAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  sidebarAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarAvatarInitials: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  sidebarName: {
    fontSize: 18,
    fontWeight: '800',
  },
  sidebarEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  sidebarRoleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  sidebarRoleText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sidebarNav: {
    paddingTop: 16,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 16,
  },
  sidebarNavText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    gap: 16,
  },
  sidebarLogoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
