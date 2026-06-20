import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function AboutScreen() {
  const router = useRouter();
  const { isDark, colors: c } = useTheme();

  const Feature = ({ icon, title, desc }) => (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }]}>
        <Ionicons name={icon} size={21} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.featureTitle, { color: c.text }]}>{title}</Text>
        <Text style={[styles.featureDesc, { color: c.subText }]}>{desc}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.cardBorder }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: c.card }]}
        >
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>About</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="school" size={38} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Next Step</Text>
          <Text style={styles.heroSub}>Empowering students with the right educational schemes</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Our Mission</Text>
          <Text style={[styles.cardBody, { color: c.subText }]}>
            Next Step is dedicated to bridging the gap between students and government
            educational schemes. We make it easy for every student to discover, understand,
            and apply for scholarships and programs that can transform their future.
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>What We Offer</Text>
          <Feature icon="document-text-outline" title="Scheme Discovery" desc="Browse all available government schemes and scholarships in one place." />
          <Feature icon="checkmark-circle-outline" title="Eligibility Info" desc="Understand exactly who qualifies with clear eligibility criteria." />
          <Feature icon="link-outline" title="Direct Apply" desc="Tap Apply to go directly to the official application page." />
          <Feature icon="lock-closed-outline" title="Secure Account" desc="Your data is protected with JWT authentication and encrypted passwords." />
        </View>

        {/* Connect */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Connect With Us</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:support@nextstep.in')}
            style={[styles.linkRow, { borderBottomColor: c.cardBorder }]}
          >
            <Ionicons name="mail-outline" size={19} color="#2563EB" />
            <Text style={[styles.linkText, { color: c.subText }]}>support@nextstep.in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://nextstep.in')}
            style={styles.linkRow}
          >
            <Ionicons name="globe-outline" size={19} color="#2563EB" />
            <Text style={[styles.linkText, { color: c.subText }]}>www.nextstep.in</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerSub, { color: c.subText }]}>Designed and Developed by</Text>
          <Text style={styles.footerName}>Pooja Mandale</Text>
          <Text style={[styles.footerCopy, { color: c.subText }]}>© 2025 Next Step. All rights reserved.</Text>
        </View>

      </ScrollView>
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
  scroll: { padding: 20, paddingBottom: 48 },

  hero: {
    backgroundColor: '#2563EB', borderRadius: 24,
    padding: 28, alignItems: 'center', marginBottom: 16,
  },
  heroIcon: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, marginTop: 12,
  },
  versionText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  card: {
    borderRadius: 22, padding: 20,
    marginBottom: 16, borderWidth: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  cardBody: { fontSize: 13, lineHeight: 21 },

  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 14 },
  featureIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  featureDesc: { fontSize: 12, lineHeight: 17 },

  linkRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, gap: 12,
  },
  linkText: { fontSize: 13 },

  footer: { alignItems: 'center', marginTop: 8 },
  footerSub: { fontSize: 12, fontWeight: '600' },
  footerName: { color: '#2563EB', fontSize: 14, fontWeight: '800', marginTop: 4 },
  footerCopy: { fontSize: 11, marginTop: 12 },
});
