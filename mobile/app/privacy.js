import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { isDark, colors: c } = useTheme();

  const Section = ({ title, content }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: c.subText }]}>{content}</Text>
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
        <Text style={[styles.headerTitle, { color: c.text }]}>Privacy Policy</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Banner */}
        <View style={[styles.banner, {
          backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF',
          borderColor: isDark ? 'rgba(59,130,246,0.25)' : '#DBEAFE',
        }]}>
          <View style={styles.bannerIcon}>
            <Ionicons name="shield-checkmark" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: isDark ? '#93C5FD' : '#1E3A8A' }]}>Your Privacy Matters</Text>
            <Text style={[styles.bannerSub, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>Last updated: May 12, 2026</Text>
          </View>
        </View>

        {/* Sections */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Section
            title="1. Information We Collect"
            content="Next Step collects information to provide better services to all our users. We collect information like your name, email address, mobile number, and profile picture when you register. If you use the secret chat feature, your secret PIN is hashed and securely stored."
          />
          <Section
            title="2. How We Use Information"
            content="We use the information we collect to provide, maintain, protect and improve our services, to develop new ones, and to protect Next Step and our users. We use your contact info to help you connect with others via the secret chat feature."
          />
          <Section
            title="3. Data Security"
            content="We work hard to protect Next Step and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold. In particular: We encrypt many of our services using SSL, and we offer a secret PIN feature for private communications."
          />
          <Section
            title="4. Your Rights"
            content="You have the right to access, update, or delete your personal information at any time through your profile settings. You can also change your password and secret code whenever you feel it is necessary."
          />
          <Section
            title="5. Contact Us"
            content="If you have any questions about this Privacy Policy, please feel free to contact us through the Help & Support section in the app."
          />
        </View>

        <Text style={[styles.footer, { color: c.subText }]}>
          © 2026 Next Step. All rights reserved.
        </Text>
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

  banner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 18,
    borderWidth: 1, marginBottom: 16, gap: 14,
  },
  bannerIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: 14, fontWeight: '800' },
  bannerSub: { fontSize: 12, marginTop: 3 },

  card: {
    borderRadius: 22, padding: 20,
    borderWidth: 1, marginBottom: 16,
  },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  sectionBody: { fontSize: 13, lineHeight: 21 },

  footer: { textAlign: 'center', fontSize: 11, fontStyle: 'italic', marginBottom: 12 },
});
