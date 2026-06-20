import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, TextInput, ActivityIndicator, Image,
  Switch, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectCurrentToken, setCredentials, logout } from '../../redux/slices/authSlice';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUpdateProfileMutation } from '../../redux/api/userApi';
import { useTheme } from '../../context/ThemeContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');

export default function ProfileScreen() {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);
  const dispatch = useDispatch();
  const router = useRouter();
  const { isDark, toggleTheme, colors: c } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [localImage, setLocalImage] = useState(null);

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setMobile(user?.mobile || '');
  }, [user]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const profileImageUri =
    localImage || (user?.profileImage ? `${BASE_URL}${user.profileImage}` : null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setLocalImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      if (localImage) {
        const filename = localImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('profileImage', { uri: localImage, name: filename, type });
      }
      const updatedUser = await updateProfile(formData).unwrap();
      dispatch(setCredentials({ user: updatedUser, token }));
      setLocalImage(null);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err?.data?.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setMobile(user?.mobile || '');
    setLocalImage(null);
    setIsEditing(false);
  };

  const handleLogout = () => {
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

  /* ── reusable row components ── */
  const InfoRow = ({ icon, label, value }) => (
    <View style={[styles.infoRow, { borderBottomColor: c.rowBorder }]}>
      <View style={[styles.infoIcon, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }]}>
        <Ionicons name={icon} size={18} color="#3B82F6" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: c.subText }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: c.text }]}>{value || '—'}</Text>
      </View>
    </View>
  );

  const EditInput = ({ icon, label, value, onChangeText, keyboardType = 'default', editable = true }) => (
    <View style={styles.editFieldGroup}>
      <Text style={[styles.editLabel, { color: c.subText }]}>{label}</Text>
      <View style={[
        styles.editInput,
        { backgroundColor: c.inputBg, borderColor: c.inputBorder },
        !editable && { opacity: 0.5 },
      ]}>
        <Ionicons name={icon} size={18} color={c.icon} />
        <TextInput
          style={[styles.editInputText, { color: c.text }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize="none"
          placeholderTextColor={c.placeholder}
        />
      </View>
    </View>
  );

  const MenuRow = ({ icon, iconBg, iconColor, label, labelColor, onPress, showArrow = true, right }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuRow, { borderBottomColor: c.rowBorder }]}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg || c.menuIconBg }]}>
        <Ionicons name={icon} size={19} color={iconColor || c.menuIconColor} />
      </View>
      <Text style={[styles.menuLabel, { color: labelColor || c.text }]}>{label}</Text>
      {right || (showArrow && <Ionicons name="chevron-forward" size={15} color={c.cardBorder} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header bar ── */}
        <View style={styles.headerBar}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Profile</Text>
          {!isEditing ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                style={[styles.iconBtn, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
              >
                <Ionicons name="settings-outline" size={19} color={isDark ? '#94A3B8' : '#475569'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.editBtn}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.cancelBtn, { backgroundColor: c.card }]}
            >
              <Ionicons name="close-outline" size={16} color={c.icon} />
              <Text style={[styles.cancelBtnText, { color: c.subText }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Avatar card ── */}
        <View style={[styles.avatarCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <TouchableOpacity
            onPress={isEditing ? handlePickImage : undefined}
            activeOpacity={isEditing ? 0.7 : 1}
            style={{ position: 'relative' }}
          >
            <View style={[styles.avatarRing, { borderColor: isDark ? '#1e2a45' : '#DBEAFE' }]}>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.avatarImg}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </View>
            {isEditing && (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.avatarName, { color: c.text }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.avatarEmail, { color: c.subText }]}>{user?.email || ''}</Text>
          <View style={[styles.roleBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }]}>
            <View style={styles.roleDot} />
            <Text style={styles.roleText}>{user?.role || 'Student'}</Text>
          </View>
        </View>

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.sectionLabel }]}>Account Information</Text>
            <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <InfoRow icon="person-outline" label="Full Name" value={user?.name} />
              <InfoRow icon="mail-outline" label="Email Address" value={user?.email} />
              <InfoRow icon="call-outline" label="Mobile" value={user?.mobile} />
            </View>
          </View>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.sectionLabel }]}>Update Profile</Text>
            <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <EditInput icon="person-outline" label="Full Name" value={name} onChangeText={setName} />
              <EditInput icon="mail-outline" label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <EditInput icon="call-outline" label="Mobile" value={user?.mobile || ''} editable={false} />
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Settings & Options ── */}
        {!isEditing && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.sectionLabel }]}>Preferences</Text>
            <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              {/* 🌙 Dark Mode Toggle */}
              <View style={[styles.menuRow, { borderBottomColor: c.rowBorder }]}>
                <View style={[styles.menuIcon, { backgroundColor: isDark ? '#1e2a45' : '#EFF6FF' }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={19} color={isDark ? '#818CF8' : '#F59E0B'} />
                </View>
                <Text style={[styles.menuLabel, { color: c.text }]}>Dark Mode</Text>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                  thumbColor={isDark ? '#fff' : '#fff'}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── More Options ── */}
        {!isEditing && (
          <View style={[styles.section, { marginBottom: 32 }]}>
            <Text style={[styles.sectionLabel, { color: c.sectionLabel }]}>More Options</Text>
            <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <MenuRow
                icon="shield-checkmark-outline"
                label="Privacy Policy"
                onPress={() => router.push('/privacy')}
              />
              <MenuRow
                icon="help-circle-outline"
                label="Help & Support"
                onPress={() => router.push('/contact')}
              />
              <MenuRow
                icon="information-circle-outline"
                label="About App"
                onPress={() => router.push('/about')}
              />
              <MenuRow
                icon="log-out-outline"
                iconBg={isDark ? '#2d1515' : '#FEF2F2'}
                iconColor="#EF4444"
                label="Logout"
                labelColor="#EF4444"
                onPress={handleLogout}
                showArrow={false}
              />
            </View>
          </View>
        )}

        {isEditing && <View style={{ height: 40 }} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* header */
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12,
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12,
  },
  cancelBtnText: { fontWeight: '700', fontSize: 13 },

  /* avatar card */
  avatarCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 28,
    paddingVertical: 28,
    borderWidth: 1,
  },
  avatarRing: {
    padding: 4, borderRadius: 60, borderWidth: 2, marginBottom: 4,
  },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 28, fontWeight: '800' },
  cameraBadge: {
    position: 'absolute', bottom: 4, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarName: { fontSize: 20, fontWeight: '800', marginTop: 10 },
  avatarEmail: { fontSize: 13, marginTop: 3 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginTop: 10, gap: 6,
  },
  roleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3B82F6' },
  roleText: { color: '#3B82F6', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  /* sections */
  section: { marginHorizontal: 20, marginTop: 20 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: 10, marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },

  /* info rows */
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
    gap: 12,
  },
  infoIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600' },

  /* edit inputs */
  editFieldGroup: { marginBottom: 14 },
  editLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  editInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    gap: 10,
  },
  editInputText: { flex: 1, fontSize: 14 },

  /* save */
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8,
    marginTop: 8, marginBottom: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  /* menu rows */
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
    gap: 12,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
});
