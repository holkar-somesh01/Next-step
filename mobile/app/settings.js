import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet, Animated, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectCurrentToken, setCredentials } from '../redux/slices/authSlice';
import { useChangePasswordMutation, useSetSecretCodeMutation, useSetAppLockCodeMutation, useDisableAppLockCodeMutation } from '../redux/api/userApi';
import { useTheme } from '../context/ThemeContext';

/* ── Reusable sub-components ── */
const SectionCard = ({ icon, iconBg, title, subtitle, children, isOpen, onToggle }) => {
  const { colors: c } = useTheme();
  return (
    <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <TouchableOpacity onPress={onToggle} style={styles.sectionHeader} activeOpacity={0.7}>
        <View style={[styles.sectionIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={21} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
          <Text style={[styles.sectionSub, { color: c.subText }]}>{subtitle}</Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.subText} />
      </TouchableOpacity>
      {isOpen && (
        <View style={[styles.sectionBody, { borderTopColor: c.cardBorder }]}>{children}</View>
      )}
    </View>
  );
};



export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);
  const { isDark, toggleTheme, colors: c } = useTheme();

  const [themeOpen, setThemeOpen] = useState(false);

  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false, pin: false, confirmPin: false, oldPin: false, appPin: false, confirmAppPin: false });
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passOpen, setPassOpen] = useState(false);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinOpen, setPinOpen] = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handlePinToggle = () => {
    setPinOpen(!pinOpen);
  };

  const [changePassword, { isLoading: changingPass }] = useChangePasswordMutation();
  const [setSecretCode, { isLoading: settingCode }] = useSetSecretCodeMutation();

  const [appPin, setAppPin] = useState('');
  const [confirmAppPin, setConfirmAppPin] = useState('');
  const [appPinOpen, setAppPinOpen] = useState(false);

  const [setAppLockCode, { isLoading: settingAppCode }] = useSetAppLockCodeMutation();
  const [disableAppLockCode, { isLoading: disablingAppLock }] = useDisableAppLockCodeMutation();

  const handleDisableAppLock = async () => {
    try {
      await disableAppLockCode().unwrap();
      dispatch(setCredentials({ user: { ...user, hasAppLockCode: false, appLockCodeLength: 0 }, token }));
      showToast('App lock disabled successfully!', 'success');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to disable app lock.', 'error');
    }
  };

  const handleSetAppLock = async () => {
    if (!appPin || !confirmAppPin) { showToast('Please enter and confirm your app lock PIN.', 'error'); return; }
    if (appPin.length < 4) { showToast('App lock PIN must be at least 4 digits.', 'error'); return; }
    if (appPin !== confirmAppPin) { showToast('PINs do not match.', 'error'); return; }
    try {
      await setAppLockCode({ code: appPin }).unwrap();
      dispatch(setCredentials({ user: { ...user, hasAppLockCode: true, appLockCodeLength: appPin.length }, token }));
      showToast('App lock PIN set successfully!', 'success');
      setAppPin(''); setConfirmAppPin('');
      setAppPinOpen(false);
    } catch (err) {
      showToast(err?.data?.message || 'Failed to set app lock.', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      showToast('Please fill in all password fields.', 'error'); return;
    }
    if (newPass.length < 6) {
      showToast('New password must be at least 6 characters.', 'error'); return;
    }
    if (newPass !== confirmPass) {
      showToast('New password and confirm password do not match.', 'error'); return;
    }
    try {
      await changePassword({ currentPassword: currentPass, newPassword: newPass }).unwrap();
      showToast('Password changed successfully!', 'success');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      setPassOpen(false);
    } catch (err) {
      showToast(err?.data?.message || 'Failed to change password.', 'error');
    }
  };

  const handleSetCode = async () => {
    if (!pin || !confirmPin) { showToast('Please enter and confirm your secret code.', 'error'); return; }
    if (pin.length < 4) { showToast('Secret code must be at least 4 digits.', 'error'); return; }
    if (pin !== confirmPin) { showToast('Secret codes do not match.', 'error'); return; }
    try {
      await setSecretCode({ code: pin }).unwrap();
      dispatch(setCredentials({ user: { ...user, hasSecretCode: true, secretCodeLength: pin.length }, token }));
      showToast('Secret code set successfully!', 'success');
      setPin(''); setConfirmPin('');
      setPinOpen(false);
    } catch (err) {
      showToast(err?.data?.message || 'Failed to set secret code.', 'error');
    }
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.cardBorder }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
        >
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: c.text }]}>Settings</Text>
          <Text style={[styles.headerSub, { color: c.subText }]}>Security & account preferences</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
        >

          {/* ── Change Password ── */}
          <SectionCard
            icon="lock-closed-outline"
            iconBg="#2563EB"
            title="Change Password"
            subtitle="Update your account password"
            isOpen={passOpen}
            onToggle={() => setPassOpen(!passOpen)}
          >
            <View style={{ paddingTop: 16 }}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: c.subText }]}>Current Password</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                  <Ionicons name="lock-closed-outline" size={17} color={c.icon} />
                  <TextInput
                    style={[styles.fieldInput, { color: c.text }]}
                    value={currentPass}
                    onChangeText={setCurrentPass}
                    placeholder="Your current password"
                    placeholderTextColor={c.placeholder}
                    textContentType="password"
                    secureTextEntry={!showPass.current}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, current: !s.current }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showPass.current ? 'eye-outline' : 'eye-off-outline'} size={17} color={c.icon} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: c.subText }]}>New Password</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                  <Ionicons name="lock-closed-outline" size={17} color={c.icon} />
                  <TextInput
                    style={[styles.fieldInput, { color: c.text }]}
                    value={newPass}
                    onChangeText={setNewPass}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor={c.placeholder}
                    textContentType="password"
                    secureTextEntry={!showPass.new}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, new: !s.new }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showPass.new ? 'eye-outline' : 'eye-off-outline'} size={17} color={c.icon} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: c.subText }]}>Confirm New Password</Text>
                <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                  <Ionicons name="lock-closed-outline" size={17} color={c.icon} />
                  <TextInput
                    style={[styles.fieldInput, { color: c.text }]}
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    placeholder="Re-enter new password"
                    placeholderTextColor={c.placeholder}
                    textContentType="password"
                    secureTextEntry={!showPass.confirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, confirm: !s.confirm }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showPass.confirm ? 'eye-outline' : 'eye-off-outline'} size={17} color={c.icon} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={changingPass}
                style={[styles.actionBtn, { backgroundColor: '#2563EB', opacity: changingPass ? 0.7 : 1 }]}
                activeOpacity={0.85}
              >
                {changingPass ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* ── Secret Code ── */}
          <SectionCard
            icon="keypad-outline"
            iconBg="#6366F1"
            title="Secret Code"
            subtitle="Create a 4–6 digit PIN for extra security"
            isOpen={pinOpen}
            onToggle={() => handlePinToggle()}
          >
            <View style={{ paddingTop: 16 }}>
              {user?.hasSecretCode ? (
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                  <Ionicons name="shield-checkmark" size={48} color="#10B981" style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 8 }}>
                    Secret Code is Already Set
                  </Text>
                  <Text style={{ fontSize: 13, color: c.subText, textAlign: 'center', marginBottom: 20 }}>
                    Your account is currently protected.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/passcode-reset')}
                    style={[styles.actionBtn, { backgroundColor: '#F59E0B', width: '100%' }]}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="refresh-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Reset Secret Code</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: c.subText }]}>Enter Secret Code (4–6 digits)</Text>
                    <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                      <Ionicons name="keypad-outline" size={17} color={c.icon} />
                      <TextInput
                        style={[styles.fieldInput, { color: c.text }]}
                        value={pin}
                        onChangeText={setPin}
                        placeholder="Enter PIN"
                        placeholderTextColor={c.placeholder}
                        secureTextEntry={!showPass.pin}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, pin: !s.pin }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name={showPass.pin ? 'eye-outline' : 'eye-off-outline'} size={17} color={c.icon} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: c.subText }]}>Confirm Passcode</Text>
                    <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                      <Ionicons name="keypad-outline" size={17} color={c.icon} />
                      <TextInput
                        style={[styles.fieldInput, { color: c.text }]}
                        value={confirmPin}
                        onChangeText={setConfirmPin}
                        placeholder="Enter PIN"
                        placeholderTextColor={c.placeholder}
                        secureTextEntry={!showPass.confirmPin}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, confirmPin: !s.confirmPin }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name={showPass.confirmPin ? 'eye-outline' : 'eye-off-outline'} size={17} color={c.icon} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.pinDots}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          { backgroundColor: i < pin.length ? '#6366F1' : (isDark ? '#252540' : '#E2E8F0') },
                        ]}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={handleSetCode}
                    disabled={settingCode}
                    style={[styles.actionBtn, {
                      backgroundColor: '#6366F1',
                      opacity: settingCode ? 0.7 : 1,
                    }]}
                    activeOpacity={0.85}
                  >
                    {settingCode ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Save Secret Code</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </SectionCard>

          {/* ── App Lock ── */}
          <SectionCard
            icon="lock-closed-outline"
            iconBg="#10B981"
            title="App Lock"
            subtitle="Lock the entire application for extra security"
            isOpen={appPinOpen}
            onToggle={() => setAppPinOpen(!appPinOpen)}
          >
            <View style={{ paddingTop: 16 }}>
              {user?.hasAppLockCode ? (
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                  <Ionicons name="lock-closed" size={48} color="#10B981" style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 8 }}>
                    App Lock is Enabled
                  </Text>
                  <Text style={{ fontSize: 13, color: c.subText, textAlign: 'center', marginBottom: 20 }}>
                    You will be prompted for your PIN when starting or resuming the app.
                  </Text>
                  <TouchableOpacity
                    onPress={handleDisableAppLock}
                    disabled={disablingAppLock}
                    style={[styles.actionBtn, { backgroundColor: '#EF4444', width: '100%' }]}
                    activeOpacity={0.85}
                  >
                    {disablingAppLock ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Disable App Lock</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: c.subText }]}>Enter App PIN (4–6 digits)</Text>
                    <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                      <Ionicons name="keypad-outline" size={17} color={c.icon} />
                      <TextInput
                        style={[styles.fieldInput, { color: c.text }]}
                        value={appPin}
                        onChangeText={setAppPin}
                        placeholder="Enter App Lock PIN"
                        placeholderTextColor={c.placeholder}
                        secureTextEntry={!showPass.appPin}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, appPin: !s.appPin }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name={showPass.appPin ? 'eye-outline' : 'eye-off-outline'} size={17} color={c.icon} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: c.subText }]}>Confirm App PIN</Text>
                    <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                      <Ionicons name="keypad-outline" size={17} color={c.icon} />
                      <TextInput
                        style={[styles.fieldInput, { color: c.text }]}
                        value={confirmAppPin}
                        onChangeText={setConfirmAppPin}
                        placeholder="Confirm App Lock PIN"
                        placeholderTextColor={c.placeholder}
                        secureTextEntry={!showPass.confirmAppPin}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, confirmAppPin: !s.confirmAppPin }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name={showPass.confirmAppPin ? 'eye-outline' : 'eye-off-outline'} size={17} color={c.icon} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.pinDots}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          { backgroundColor: i < appPin.length ? '#10B981' : (isDark ? '#252540' : '#E2E8F0') },
                        ]}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={handleSetAppLock}
                    disabled={settingAppCode}
                    style={[styles.actionBtn, {
                      backgroundColor: '#10B981',
                      opacity: settingAppCode ? 0.7 : 1,
                    }]}
                    activeOpacity={0.85}
                  >
                    {settingAppCode ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Enable App Lock</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </SectionCard>

          {/* ── App Theme ── */}
          <SectionCard
            icon="color-palette-outline"
            iconBg="#3B82F6"
            title="App Theme"
            subtitle="Switch between light and dark mode"
            isOpen={themeOpen}
            onToggle={() => setThemeOpen(!themeOpen)}
          >
            <View style={{ paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: c.text }}>Dark Mode</Text>
                <Text style={{ fontSize: 12, color: c.subText, marginTop: 2 }}>
                  Use a dark theme for low light environments
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor="#fff"
              />
            </View>
          </SectionCard>

        {/* ── Security Tips ── */}
          <View style={[styles.tipCard, {
            backgroundColor: isDark ? 'rgba(217,119,6,0.1)' : '#FFFBEB',
            borderColor: isDark ? 'rgba(217,119,6,0.25)' : '#FDE68A',
          }]}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={17} color="#D97706" />
              <Text style={[styles.tipTitle, { color: isDark ? '#FCD34D' : '#92400E' }]}>Security Tips</Text>
            </View>
            <Text style={[styles.tipBody, { color: isDark ? '#FCD34D' : '#B45309' }]}>
              {'• Never share your password or secret code with anyone.\n'}
              {'• Use a combination of letters, numbers, and symbols for your password.\n'}
              {'• Change your password regularly for better security.'}
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Toast Notification ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          {
            backgroundColor: toastType === 'success' ? (isDark ? '#064e3b' : '#10B981') : (isDark ? '#7f1d1d' : '#EF4444'),
            opacity: toastAnim,
            transform: [{
              translateY: toastAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ]}
      >
        <Ionicons name={toastType === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={18} color="#fff" />
        <Text style={[styles.toastText, { color: '#fff' }]}>{toastMsg}</Text>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1, gap: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 48 },

  sectionCard: {
    borderRadius: 22, marginBottom: 16,
    borderWidth: 1, overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 18, gap: 14,
  },
  sectionIcon: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionSub: { fontSize: 12, marginTop: 2 },
  sectionBody: { paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 1 },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 7, marginLeft: 2 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  fieldInput: { flex: 1, fontSize: 14, padding: 0, minHeight: 24 },

  actionBtn: {
    borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderRadius: 14,
    padding: 14, gap: 10, marginBottom: 16,
  },
  warningText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 18 },

  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 12, height: 12, borderRadius: 6 },

  tipCard: {
    borderRadius: 20, padding: 18, borderWidth: 1,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tipTitle: { fontWeight: '700', fontSize: 13 },
  tipBody: { fontSize: 12, lineHeight: 20 },

  toast: {
    position: 'absolute',
    bottom: 36,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
