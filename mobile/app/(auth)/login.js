import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useUpdatePublicKeyMutation } from '../../redux/api/authApi';
import { setCredentials } from '../../redux/slices/authSlice';
import { generateAndStoreKeyPair, getPrivateKey } from '../../utils/crypto';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { registered } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isDark: dark, colors: c } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Interactive anim states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animated values for input fields focus transitions
  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const passFocusAnim = useRef(new Animated.Value(0)).current;

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

   
  useEffect(() => {
    if (registered === 'true') {
      showToast('Registration successful! Please login.', 'success');
    }
  }, [registered]);

  // Animate email input focus
   
  useEffect(() => {
    Animated.timing(emailFocusAnim, {
      toValue: emailFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused]);

  // Animate password input focus
   
  useEffect(() => {
    Animated.timing(passFocusAnim, {
      toValue: passwordFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused]);

  const [login, { isLoading }] = useLoginMutation();
  const [updatePublicKey] = useUpdatePublicKeyMutation();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please fill all fields', 'error');
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    try {
      const responseData = await login({ email: trimmedEmail, password }).unwrap();
      const userData = { ...responseData }; // Make a mutable copy to prevent TypeError

      
      // Handle E2EE Keys
      let privateKey = await getPrivateKey(userData._id);
      let newPublicKey = null;
      if (!privateKey || !userData.publicKey) {
        const keys = await generateAndStoreKeyPair(userData._id);
        userData.publicKey = keys.publicKey;
        newPublicKey = keys.publicKey;
      }

      dispatch(setCredentials({ user: userData, token: userData.token, justLoggedIn: true }));
      
      if (newPublicKey) {
        try {
          await updatePublicKey({ publicKey: newPublicKey }).unwrap();
        } catch (err) {
          console.error("Failed to sync public key:", err);
        }
      }

      showToast('Welcome back!', 'success');
      setTimeout(() => {
        if (userData.role === 'admin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(tabs)');
        }
      }, 1200);
    } catch (error) {
      console.log('Login Error Details:', error);
      let message = 'Invalid email or password';
      
      if (error.status === 'FETCH_ERROR') {
         message = 'Network Error: Cannot connect to server.';
      } else if (error.data && error.data.message) {
         message = error.data.message;
      } else if (error.error) {
         message = error.error;
      } else if (error.message) {
         message = error.message;
      } else {
         // Fallback to show exact error string if it's completely unknown
         message = 'Error: ' + JSON.stringify(error);
      }

      showToast(message, 'error');
    }
  };

  // Interpolated input borders and backgrounds
  const emailBorderColor = emailFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.inputBorder, '#6366F1'],
  });
  const emailBg = emailFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.inputBg, dark ? '#252549' : '#EFF6FF'],
  });

  const passBorderColor = passFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.inputBorder, '#6366F1'],
  });
  const passBg = passFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.inputBg, dark ? '#252549' : '#EFF6FF'],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: c.bg }]}
    >
      {/* Background ambient glow effect */}
      <View style={[styles.glowCircle, { backgroundColor: dark ? '#312E81' : '#DBEAFE', opacity: dark ? 0.35 : 0.6 }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Block */}
        <LinearGradient
          colors={dark ? ['#1E1B4B', '#111827'] : ['#2563EB', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.iconRing}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headingTitle}>Welcome Back</Text>
          <Text style={styles.headingSubtitle}>Sign in to continue your journey</Text>
        </LinearGradient>

        {/* Form Card */}
        <View style={[
          styles.card, 
          { 
            backgroundColor: dark ? 'rgba(26,26,46,0.85)' : 'rgba(255,255,255,0.92)',
            borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          }
        ]}>

          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.text }]}>Email Address</Text>
            <Animated.View style={[
              styles.inputRow,
              { backgroundColor: emailBg, borderColor: emailBorderColor },
            ]}>
              <Ionicons name="mail" size={20} color={emailFocused ? '#6366F1' : c.icon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                placeholder="Enter your email"
                placeholderTextColor={c.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </Animated.View>
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: c.text }]}>Password</Text>
            <Animated.View style={[
              styles.inputRow,
              { backgroundColor: passBg, borderColor: passBorderColor },
            ]}>
              <Ionicons name="lock-closed" size={20} color={passwordFocused ? '#6366F1' : c.icon} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                placeholder="Enter your password"
                placeholderTextColor={c.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={c.icon}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Forgot link */}
          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.88}
            style={styles.btnWrapper}
          >
            <LinearGradient
              colors={['#4F46E5', '#6366F1', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.signInBtn, isLoading && { opacity: 0.8 }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Create account link */}
          <View style={styles.bottomRow}>
            <Text style={[styles.bottomPrompt, { color: c.subText }]}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.bottomLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>

      {/* Toast popup */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          {
            backgroundColor: toastType === 'success' ? (dark ? '#064e3b' : '#10B981') : (dark ? '#7f1d1d' : '#EF4444'),
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
        <Ionicons name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'} size={18} color="#fff" />
        <Text style={[styles.toastText, { color: '#fff' }]}>{toastMsg}</Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  glowCircle: {
    position: 'absolute',
    width: width * 1.0,
    height: width * 1.0,
    borderRadius: (width * 1.0) / 2,
    top: height * 0.18,
    right: -width * 0.25,
    filter: 'blur(90px)',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 72,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  headingTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  headingSubtitle: {
    color: '#BFDBFE',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    marginTop: -32,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  fieldGroup: { marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 15 : 11,
    gap: 12,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 36,
  },
  forgotText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
  btnWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  signInBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPrompt: { fontSize: 14, fontWeight: '500' },
  bottomLink: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '800',
  },
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
