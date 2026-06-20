import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Image, Modal, Alert, StyleSheet, Switch, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { useGetSecretContactsQuery, useAddSecretContactMutation } from '../../redux/api/secretContactApi';
import { useTheme } from '../../context/ThemeContext';
import { ContactRowSkeleton } from '../../components/Skeleton';
import AppLock from '../../components/AppLock';
import io from 'socket.io-client';

export default function ChatsScreen() {
  const router = useRouter();
  const currentUser = useSelector(selectCurrentUser);
  const { isDark, toggleTheme, colors: c } = useTheme();
  const { data: contacts, isLoading, isFetching, refetch } = useGetSecretContactsQuery();
  const [addSecretContact, { isLoading: isAdding }] = useAddSecretContactMutation();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactMobile, setNewContactMobile] = useState('');

  const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');
  const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');
  const socket = useRef(null);

  const filteredContacts = contacts?.filter(contact =>
    (!currentUser || contact.owner === currentUser._id) &&
    (contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.mobile.includes(search))
  );

  useEffect(() => {
    if (!currentUser) router.replace('/(auth)/login');
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?._id) return;
    socket.current = io(SOCKET_URL);
    socket.current.emit('join_room', currentUser._id);
    socket.current.on('new_message_notification', () => {
      refetch();
    });
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleInviteWhatsApp = (mobile) => {
    const message = encodeURIComponent("Hey! Join me on the Next Step app to chat securely. Download now!");
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanMobile}&text=${message}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${cleanMobile}?text=${message}`);
      }
    }).catch(err => console.error('Error opening WhatsApp', err));
  };

  const handleAddContact = async () => {
    if (!newContactName || !newContactMobile) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      const result = await addSecretContact({ name: newContactName, mobile: newContactMobile }).unwrap();
      if (!result.contactUserId) {
        Alert.alert('Contact Saved', `${newContactName} is not on Next Step yet. Would you like to invite them?`, [
          { text: 'Later', style: 'cancel' },
          { text: 'Invite via WhatsApp', onPress: () => handleInviteWhatsApp(newContactMobile) },
        ]);
      } else {
        Alert.alert('Success', 'Contact added successfully');
      }
      setModalVisible(false);
      setNewContactName('');
      setNewContactMobile('');
    } catch (err) {
      Alert.alert('Error', err.data?.message || 'Failed to add contact');
    }
  };

  return (
    <AppLock>
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: isDark ? '#16213e' : '#2563EB' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* ── Search Bar ── */}
      <View style={[styles.searchWrap, { backgroundColor: c.card, borderBottomColor: c.cardBorder }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}>
          <Ionicons name="search-outline" size={17} color={c.icon} />
          <TextInput
            placeholder="Search chats..."
            placeholderTextColor={c.placeholder}
            style={[styles.searchInput, { color: c.text }]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={c.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Contacts List ── */}
      <FlatList
        data={isLoading ? [1, 2, 3, 4] : filteredContacts}
        keyExtractor={(item, index) => isLoading ? `skeleton-${index}` : item._id}
        contentContainerStyle={{ paddingBottom: 100 }}
        onRefresh={refetch}
        refreshing={isFetching && !isLoading}
        renderItem={({ item }) => {
          if (isLoading) {
            return <ContactRowSkeleton />;
          }
          return (
            <TouchableOpacity
              onPress={() =>
                item.contactUserId
                  ? router.push({
                      pathname: `/chats/${item.contactUserId._id}`,
                      params: { contactName: item.name },
                    })
                  : Alert.alert('Invite', 'This user is not registered. Send invite?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Invite via WhatsApp', onPress: () => handleInviteWhatsApp(item.mobile) }
                    ])
              }
              style={[styles.contactRow, { borderBottomColor: c.cardBorder }]}
              activeOpacity={0.75}
            >
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: isDark ? '#252540' : '#EFF6FF' }]}>
                {item.contactUserId?.profileImage ? (
                  <Image
                    source={{ uri: `${BASE_URL}${item.contactUserId.profileImage}` }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactName, { color: c.text, marginBottom: 4 }]}>{item.name}</Text>
                <Text style={[styles.contactPreview, { color: c.subText }]} numberOfLines={1}>
                  {item.contactUserId
                    ? (item.lastMessage?.message || 'No messages yet')
                    : `Not on Next Step • ${item.mobile}`}
                </Text>
              </View>

              {/* Right Side Info (Time + Unread Badge) */}
              {item.contactUserId && (
                <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 5, paddingLeft: 10 }}>
                  {item.lastMessage?.createdAt ? (
                    <Text style={[styles.contactTime, { color: c.subText }]}>
                      {formatTime(item.lastMessage.createdAt)}
                    </Text>
                  ) : null}
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Invite badge */}
              {!item.contactUserId && (
                <TouchableOpacity
                  onPress={() => handleInviteWhatsApp(item.mobile)}
                  style={[styles.inviteBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }]}
                >
                  <Text style={styles.inviteText}>INVITE</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => {
          if (isLoading) return null;
          return (
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIcon, { backgroundColor: c.card }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={38} color={c.subText} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text }]}>No chats yet</Text>
              <Text style={[styles.emptySub, { color: c.subText }]}>
                Tap the + button to add a contact and start chatting securely.
              </Text>
            </View>
          );
        }}
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.fab}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* ── Add Contact Modal ── */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>New Contact</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={c.subText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: c.subText }]}>Name</Text>
            <View style={[styles.modalInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
              <Ionicons name="person-outline" size={17} color={c.icon} />
              <TextInput
                style={[styles.modalInputText, { color: c.text }]}
                placeholder="Enter contact name"
                placeholderTextColor={c.placeholder}
                value={newContactName}
                onChangeText={setNewContactName}
              />
            </View>

            <Text style={[styles.modalLabel, { color: c.subText }]}>Mobile Number</Text>
            <View style={[styles.modalInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
              <Ionicons name="call-outline" size={17} color={c.icon} />
              <TextInput
                style={[styles.modalInputText, { color: c.text }]}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor={c.placeholder}
                value={newContactMobile}
                onChangeText={setNewContactMobile}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              onPress={handleAddContact}
              disabled={isAdding}
              style={[styles.modalBtn, isAdding && { opacity: 0.7 }]}
              activeOpacity={0.85}
            >
              {isAdding
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.modalBtnText}>Save Contact</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </AppLock>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBackBtn: { padding: 2 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  togglePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, gap: 2,
  },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 24, paddingHorizontal: 14, paddingVertical: 9, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },

  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, gap: 14,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#3B82F6', fontWeight: '700', fontSize: 16 },
  contactTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  contactName: { fontSize: 15, fontWeight: '700' },
  contactTime: { fontSize: 11 },
  contactPreview: { fontSize: 13 },
  unreadBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  inviteBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  inviteText: { color: '#3B82F6', fontSize: 10, fontWeight: '800' },

  emptyBox: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 28, right: 22,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 2 },
  modalInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    gap: 10, marginBottom: 16,
  },
  modalInputText: { flex: 1, fontSize: 14 },
  modalBtn: {
    backgroundColor: '#2563EB', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
