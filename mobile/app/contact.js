import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubmitContactMutation } from '../redux/api/contactApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../redux/slices/authSlice';
import { useTheme } from '../context/ThemeContext';

export default function ContactScreen() {
  const router = useRouter();
  const user = useSelector(selectCurrentUser);
  const { isDark, colors: c } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitContact, { isLoading }] = useSubmitContactMutation();

  const handleSubmit = async () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Missing Fields', 'Please fill in all fields before submitting.');
      return;
    }
    try {
      await submitContact({ name, email, subject, message }).unwrap();
      Alert.alert('Message Sent! ✅', 'We received your message and will get back to you soon.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      setSubject('');
      setMessage('');
    } catch (err) {
      Alert.alert('Error', err?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  const InputField = ({ icon, label, value, onChangeText, placeholder, multiline, keyboardType }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: c.subText }]}>{label}</Text>
      <View style={[
        styles.fieldBox,
        { backgroundColor: c.inputBg, borderColor: c.inputBorder },
        multiline && { alignItems: 'flex-start', paddingTop: 12 },
      ]}>
        <Ionicons
          name={icon}
          size={17}
          color={c.icon}
          style={{ marginTop: multiline ? 2 : 0 }}
        />
        <TextInput
          style={[
            styles.fieldInput,
            { color: c.text },
            multiline && { height: 110, textAlignVertical: 'top' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.placeholder}
          multiline={multiline}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
        />
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
        <View>
          <Text style={[styles.headerTitle, { color: c.text }]}>Contact Us</Text>
          <Text style={[styles.headerSub, { color: c.subText }]}>We reply within 24 hours</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoBannerIcon}>
              <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoBannerTitle}>Have a question?</Text>
              <Text style={styles.infoBannerSub}>
                Fill the form below and our team will get back to you shortly.
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <InputField icon="person-outline" label="Your Name" value={name} onChangeText={setName} placeholder="John Doe" />
            <InputField icon="mail-outline" label="Email Address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
            <InputField icon="document-text-outline" label="Subject" value={subject} onChangeText={setSubject} placeholder="What is this about?" />
            <InputField icon="chatbubble-outline" label="Message" value={message} onChangeText={setMessage} placeholder="Write your message here..." multiline />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.sendBtn, isLoading && { opacity: 0.7 }]}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={17} color="#fff" />
                  <Text style={styles.sendBtnText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Contact */}
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.contactTitle, { color: c.text }]}>Other ways to reach us</Text>
            <View style={[styles.contactRow, { borderBottomColor: c.cardBorder }]}>
              <Ionicons name="mail" size={16} color="#2563EB" />
              <Text style={[styles.contactText, { color: c.subText }]}>support@nextstep.in</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="time-outline" size={16} color="#2563EB" />
              <Text style={[styles.contactText, { color: c.subText }]}>Mon–Sat, 9am–6pm IST</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { padding: 20, paddingBottom: 40 },

  infoBanner: {
    backgroundColor: '#2563EB', borderRadius: 20,
    padding: 18, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  infoBannerIcon: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  infoBannerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  infoBannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3, lineHeight: 17 },

  card: {
    borderRadius: 22, padding: 20,
    marginBottom: 16, borderWidth: 1,
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 7, marginLeft: 2 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  fieldInput: { flex: 1, fontSize: 14 },

  sendBtn: {
    backgroundColor: '#2563EB', borderRadius: 14,
    paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 4,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  contactTitle: { fontSize: 14, fontWeight: '700', marginBottom: 14 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, gap: 10,
  },
  contactText: { fontSize: 13 },
});
