import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminSidebar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDark: dark, colors: c } = useTheme();

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  const SidebarItem = ({ title, icon, route }) => (
    <TouchableOpacity 
      onPress={() => router.push(route)}
      style={[styles.sidebarItem, { borderBottomColor: c.rowBorder }]}
    >
      <View style={[styles.itemIconContainer, { backgroundColor: dark ? '#252540' : '#F8FAFC' }]}>
        <Ionicons name={icon} size={20} color={dark ? '#A5B4FC' : '#4F46E5'} />
      </View>
      <Text style={[styles.itemText, { color: c.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.subText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header Profile Panel */}
      <LinearGradient
        colors={dark ? ['#1e1b4b', '#0f172a'] : ['#1E3A8A', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileHeader}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || 'Admin')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.adminName}>{user?.name || 'Admin User'}</Text>
        <Text style={styles.adminEmail}>{user?.email || 'admin@nextstep.com'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PORTAL MANAGER</Text>
        </View>
      </LinearGradient>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <SidebarItem title="Dashboard Overview" icon="grid-outline" route="/(admin)" />
        <SidebarItem title="Manage Users" icon="people-outline" route="/(admin)/users" />
        <SidebarItem title="Contact Inquiries" icon="chatbubbles-outline" route="/(admin)/contacts" />
      </View>

      <View style={{ flex: 1 }} />

      {/* Logout */}
      <TouchableOpacity 
        onPress={handleLogout}
        style={[styles.logoutButton, { borderTopColor: c.rowBorder }]}
      >
        <View style={styles.logoutIconWrapper}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </View>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 24,
  },
  closeButton: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  adminName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  adminEmail: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  menuContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
  },
  logoutIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '700',
  },
});
