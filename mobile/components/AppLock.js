import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, Vibration, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectIsChatUnlocked, setChatUnlocked } from '../redux/slices/authSlice';
import { useVerifySecretCodeMutation } from '../redux/api/userApi';
import { useTheme } from '../context/ThemeContext';

/**
 * AppLock
 * Shown as a full-screen overlay for chat access.
 * Only active if the logged-in user has set a secret code (user.hasSecretCode).
 */
export default function AppLock({ children }) {
  const user = useSelector(selectCurrentUser);
  const isChatUnlocked = useSelector(selectIsChatUnlocked);
  const dispatch = useDispatch();
  const { isDark } = useTheme();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [verifySecretCode, { isLoading }] = useVerifySecretCodeMutation();

  // Reset inputs when lock status changes
  useEffect(() => {
    setPin('');
    setError('');
    setAttempts(0);
  }, [isChatUnlocked]);

  // Shake animation on wrong PIN
  const shake = useCallback(() => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Verify PIN function
  const verifyPin = useCallback(async (code) => {
    try {
      await verifySecretCode({ code }).unwrap();
      // Correct PIN — unlock
      dispatch(setChatUnlocked(true));
      setPin('');
      setError('');
      setAttempts(0);
    } catch {
      // Wrong PIN
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      shake();
      setPin('');
      setError(
        newAttempts >= 5
          ? 'Too many attempts. Try again later.'
          : `Incorrect PIN. ${5 - newAttempts} attempt${5 - newAttempts !== 1 ? 's' : ''} left.`
      );
    }
  }, [verifySecretCode, attempts, shake, dispatch]);

  // Handle digit press
  const handleDigit = useCallback((digit) => {
    const targetLength = user?.secretCodeLength || 6;
    if (pin.length >= targetLength) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length >= targetLength) {
      verifyPin(newPin);
    }
  }, [pin, user, verifyPin]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const handleSubmit = useCallback(() => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      shake();
      return;
    }
    verifyPin(pin);
  }, [pin, shake, verifyPin]);

  const shouldLock = !isChatUnlocked && user !== null && user !== undefined && user.hasSecretCode === true;
  if (!shouldLock) {
    return <>{children}</>;
  }

  const bg = isDark ? '#0a0a14' : '#1E3A8A';

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={bg} />
      <View style={[styles.overlay, { backgroundColor: bg }]}>

        {/* Icon + Title */}
        <View style={styles.top}>
          <View style={[styles.lockIcon, { backgroundColor: isDark ? '#252540' : 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="shield-checkmark" size={36} color="#3B82F6" />
          </View>
          <Text style={styles.appName}>Next Step Secure Chats</Text>
          <Text style={styles.subtitle}>Enter your secret PIN to access chats</Text>
        </View>

        {/* PIN Dots */}
        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: user?.secretCodeLength || 6 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < pin.length
                      ? '#3B82F6'
                      : isDark ? '#252540' : 'rgba(255,255,255,0.25)',
                  borderColor:
                    i < pin.length
                      ? '#3B82F6'
                      : isDark ? '#374151' : 'rgba(255,255,255,0.5)',
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Error message */}
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={14} color="#FCA5A5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Numpad */}
        <View style={styles.numpad}>
          {['1','2','3','4','5','6','7','8','9','✓','0','⌫'].map((key, idx) => {
            const isDelete = key === '⌫';
            const isSubmit = key === '✓';
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  if (isDelete) handleDelete();
                  else if (isSubmit) handleSubmit();
                  else handleDigit(key);
                }}
                style={[
                  styles.numKey,
                  (!isDelete && !isSubmit) && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)' },
                  isSubmit && { backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)' }
                ]}
                activeOpacity={0.7}
              >
                {isDelete ? (
                  <Ionicons name="backspace-outline" size={24} color="rgba(255,255,255,0.8)" />
                ) : isSubmit ? (
                  <Ionicons name="checkmark-outline" size={26} color={isDark ? '#60A5FA' : '#3B82F6'} />
                ) : (
                  <Text style={styles.numKeyText}>{key}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading && (
          <Text style={styles.verifyingText}>Verifying…</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  top: { alignItems: 'center', marginBottom: 40 },
  lockIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  appName: {
    color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 6, textAlign: 'center',
  },

  dotsRow: {
    flexDirection: 'row', gap: 14, marginBottom: 20,
  },
  dot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: 20,
  },
  errorText: { color: '#FCA5A5', fontSize: 12, fontWeight: '600' },

  numpad: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 14, marginTop: 10,
    width: '100%', maxWidth: 280,
  },
  numKey: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  numKeyText: {
    color: '#fff', fontSize: 24, fontWeight: '600',
  },

  verifyingText: {
    color: 'rgba(255,255,255,0.5)', marginTop: 20, fontSize: 13,
  },
});
