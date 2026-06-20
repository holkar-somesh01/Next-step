import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import { getItem } from '../utils/storage';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function SplashScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();

    // Breathing logo animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.98, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Background ambient glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Check session
    const checkSession = async () => {
      try {
        const token = await getItem('userToken');

        if (token) {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const user = await res.json();
            dispatch(setCredentials({ user, token, justLoggedIn: false }));
            setTimeout(() => router.replace('/(tabs)'), 2000);
            return;
          }
        }
      } catch (e) {
        // Fallback on error
      }
      setTimeout(() => router.replace('/(auth)/login'), 2500);
    };

    checkSession();
  }, []);

  return (
    <LinearGradient
      colors={['#0A0F1D', '#151030', '#1C0D26']}
      style={styles.container}
    >
      {/* Ambient background glows */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowAnim }]} />

      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] 
          }
        ]}
      >
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>NEXT STEP</Text>
        <Text style={styles.subtitle}>ELEVATE YOUR LEARNING</Text>
      </Animated.View>

      <View style={styles.bottom}>
        <ActivityIndicator size="small" color="#6366F1" style={{ marginBottom: 16 }} />
        <Text style={styles.poweredBy}>Powered by Advanced AI</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#0A0F1D'
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: '#4F46E5',
    top: height * 0.15,
    filter: 'blur(100px)', // Available on modern systems, falls back gracefully
    opacity: 0.4,
  },
  content: { 
    alignItems: 'center',
    zIndex: 2,
  },
  logoWrapper: {
    padding: 6,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  logo: { 
    width: 140, 
    height: 140, 
    borderRadius: 36 
  },
  title: { 
    color: '#fff', 
    fontSize: 34, 
    fontWeight: '900', 
    marginTop: 28, 
    letterSpacing: 8,
    textShadowColor: 'rgba(99, 102, 241, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: { 
    color: '#94A3B8', 
    fontSize: 12, 
    marginTop: 10, 
    fontWeight: '700',
    letterSpacing: 3,
  },
  bottom: { 
    position: 'absolute', 
    bottom: 48,
    alignItems: 'center',
    zIndex: 2,
  },
  poweredBy: { 
    color: '#64748B', 
    fontSize: 11, 
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
