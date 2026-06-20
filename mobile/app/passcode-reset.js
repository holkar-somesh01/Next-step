import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectCurrentToken, setCredentials } from '../redux/slices/authSlice';
import { useResetSecretCodeMutation } from '../redux/api/userApi';
import { useTheme } from '../context/ThemeContext';

export default function PasscodeResetScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);
  const { isDark, colors: c } = useTheme();

  const [oldPin, setOldPin] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

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

  const [showPass, setShowPass] = useState({
    oldPin: false,
    pin: false,
    confirmPin: false,
  });

  const [resetSecretCode, { isLoading }] = useResetSecretCodeMutation();

  const handleResetCode = async () => {
    if (!oldPin || !pin || !confirmPin) {
      showToast('Please fill in all passcode fields.', 'error');
      return;
    }
    if (pin.length < 4) {
      showToast('New passcode must be at least 4 digits.', 'error');
      return;
    }
    if (pin !== confirmPin) {
      showToast('New passcodes do not match.', 'error');
      return;
    }
    if (oldPin === pin) {
      showToast('New passcode cannot be the same as the old passcode.', 'error');
      return;
    }

    try {
      await resetSecretCode({ oldCode: oldPin, newCode: pin }).unwrap();
      
      // Keep Redux completely in sync immediately
      dispatch(setCredentials({ user: { ...user, hasSecretCode: true, secretCodeLength: pin.length }, token }));

      showToast('Passcode updated successfully!', 'success');
      setTimeout(() => {
        router.replace('/chats');
      }, 1500);
    } catch (err) {
      showToast(err?.data?.message || 'Failed to reset passcode. Please check your old passcode.', 'error');
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
          <Text style={[styles.headerTitle, { color: c.text }]}>Reset Passcode</Text>
          <Text style={[styles.headerSub, { color: c.subText }]}>Update your secure secret chat code</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            
            {/* Old Passcode */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.subText }]}>Enter Old Passcode</Text>
              <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                <Ionicons name="keypad-outline" size={17} color={c.icon} />
                <TextInput
                  style={[styles.fieldInput, { color: c.text }]}
                  value={oldPin}
                  onChangeText={setOldPin}
                  placeholder="Enter old PIN"
                  placeholderTextColor={c.placeholder}
                  secureTextEntry={!showPass.oldPin}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={() => setShowPass((s) => ({ ...s, oldPin: !s.oldPin }))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPass.oldPin ? 'eye-outline' : 'eye-off-outline'}
                    size={17}
                    color={c.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Passcode */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.subText }]}>New Passcode (4–6 digits)</Text>
              <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                <Ionicons name="keypad-outline" size={17} color={c.icon} />
                <TextInput
                  style={[styles.fieldInput, { color: c.text }]}
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter new PIN"
                  placeholderTextColor={c.placeholder}
                  secureTextEntry={!showPass.pin}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={() => setShowPass((s) => ({ ...s, pin: !s.pin }))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPass.pin ? 'eye-outline' : 'eye-off-outline'}
                    size={17}
                    color={c.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Passcode */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.subText }]}>Confirm New Passcode</Text>
              <View style={[styles.fieldBox, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
                <Ionicons name="keypad-outline" size={17} color={c.icon} />
                <TextInput
                  style={[styles.fieldInput, { color: c.text }]}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="Re-enter new PIN"
                  placeholderTextColor={c.placeholder}
                  secureTextEntry={!showPass.confirmPin}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={() => setShowPass((s) => ({ ...s, confirmPin: !s.confirmPin }))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPass.confirmPin ? 'eye-outline' : 'eye-off-outline'}
                    size={17}
                    color={c.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Pin dots animation helpers */}
            <View style={styles.pinDots}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i < pin.length
                          ? '#6366F1'
                          : isDark
                          ? '#252540'
                          : '#E2E8F0',
                    },
                  ]}
                />
              ))}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              onPress={handleResetCode}
              disabled={isLoading}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: '#6366F1',
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Save New Passcode</Text>
                </>
              )}
            </TouchableOpacity>

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 48 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 7, marginLeft: 2 },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  fieldInput: { flex: 1, fontSize: 14, padding: 0, minHeight: 24 },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 20 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
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
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
