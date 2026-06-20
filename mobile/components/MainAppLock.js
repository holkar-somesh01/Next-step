import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, Vibration, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectIsAppUnlocked, setAppUnlocked } from '../redux/slices/authSlice';
import { useVerifyAppLockCodeMutation } from '../redux/api/userApi';
import { useTheme } from '../context/ThemeContext';

/**
 * MainAppLock
 * Shown as a full-screen overlay for the entire application stack.
 * Only active if the logged-in user has set an app lock code (user.hasAppLockCode).
 */
export default function MainAppLock({ children }) {
  const user = useSelector(selectCurrentUser);
  const isAppUnlocked = useSelector(selectIsAppUnlocked);
  const dispatch = useDispatch();
  const { isDark } = useTheme();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [verifyAppLockCode, { isLoading }] = useVerifyAppLockCodeMutation();

  // Reset inputs when lock status changes
  useEffect(() => {
    setPin('');
    setError('');
    setAttempts(0);
  }, [isAppUnlocked]);

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
      await verifyAppLockCode({ code }).unwrap();
      // Correct PIN — unlock
      dispatch(setAppUnlocked(true));
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
  }, [verifyAppLockCode, attempts, shake, dispatch]);

  // Handle digit press
  const handleDigit = useCallback((digit) => {
    const targetLength = user?.appLockCodeLength || 6;
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

  const shouldLock = !isAppUnlocked && user !== null && user !== undefined && user.hasAppLockCode === true;
  if (!shouldLock) {
    return <>{children}</>;
  }

  const bg = isDark ? '#08080f' : '#1e1b4b';

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={bg} />
      <View style={[styles.overlay, { backgroundColor: bg }]}>

        {/* Icon + Title */}
        <View style={styles.top}>
          <View style={[styles.lockIcon, { backgroundColor: isDark ? '#1e1b4b' : 'rgba(255,255,255,0.1)' }]}>
            <Ionicons name="lock-closed" size={36} color="#6366F1" />
          </View>
          <Text style={styles.appName}>Next Step App Lock</Text>
          <Text style={styles.subtitle}>Enter your App PIN to access the application</Text>
        </View>

        {/* PIN Dots */}
        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: user?.appLockCodeLength || 6 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < pin.length
                      ? '#6366F1'
                      : isDark ? '#1e1b4b' : 'rgba(255,255,255,0.2)',
                  borderColor:
                    i < pin.length
                      ? '#6366F1'
                      : isDark ? '#2e2a75' : 'rgba(255,255,255,0.4)',
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
                  (!isDelete && !isSubmit) && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)' },
                  isSubmit && { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)' }
                ]}
                activeOpacity={0.7}
              >
                {isDelete ? (
                  <Ionicons name="backspace-outline" size={24} color="rgba(255,255,255,0.8)" />
                ) : isSubmit ? (
                  <Ionicons name="checkmark-outline" size={26} color={isDark ? '#818CF8' : '#6366F1'} />
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
    zIndex: 10000,
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
