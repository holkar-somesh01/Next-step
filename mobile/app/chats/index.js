import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Image, Modal, Alert, StyleSheet, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { 
  useGetSecretContactsQuery, 
  useAddSecretContactMutation,
  useUpdateSecretContactMutation,
  useDeleteSecretContactMutation 
} from '../../redux/api/secretContactApi';
import { useClearChatHistoryMutation, useMarkAsReadMutation } from '../../redux/api/chatApi';
import {
  useBlockUserMutation,
  useUnblockUserMutation,
  useMuteUserMutation,
  useUnmuteUserMutation,
  useReportUserMutation,
} from '../../redux/api/userApi';
import { useTheme } from '../../context/ThemeContext';
import { ContactRowSkeleton } from '../../components/Skeleton';
import AppLock from '../../components/AppLock';
import { io } from 'socket.io-client';

export default function ChatsScreen() {
  const router = useRouter();
  const currentUser = useSelector(selectCurrentUser);
  const { isDark, colors: c } = useTheme();
  const { data: contacts, isLoading, isFetching, refetch } = useGetSecretContactsQuery();
  const [addSecretContact, { isLoading: isAdding }] = useAddSecretContactMutation();
  const [updateSecretContact] = useUpdateSecretContactMutation();
  const [deleteSecretContact] = useDeleteSecretContactMutation();
  const [clearChatHistory] = useClearChatHistoryMutation();
  const [markAsRead] = useMarkAsReadMutation();
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [muteUser] = useMuteUserMutation();
  const [unmuteUser] = useUnmuteUserMutation();
  const [reportUser] = useReportUserMutation();
 
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactMobile, setNewContactMobile] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

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

  const handleLongPressContact = (item) => {
    setSelectedContact(item);
    setOptionsModalVisible(true);
  };

  const handleTogglePin = async (id, currentlyPinned) => {
    try {
      await updateSecretContact({ id, isPinned: !currentlyPinned }).unwrap();
    } catch (err) {
      Alert.alert('Error', err.data?.message || 'Failed to toggle pin status');
    }
  };

  const handleToggleUnread = async (item) => {
    try {
      const isMarkedUnread = item.isMarkedUnread;
      const hasUnread = item.unreadCount > 0 || isMarkedUnread;
      
      if (hasUnread) {
        if (item.contactUserId) {
          await markAsRead(item.contactUserId._id).unwrap();
        }
        await updateSecretContact({ id: item._id, isMarkedUnread: false }).unwrap();
      } else {
        await updateSecretContact({ id: item._id, isMarkedUnread: true }).unwrap();
      }
    } catch (err) {
      Alert.alert('Error', err.data?.message || 'Failed to toggle unread status');
    }
  };

  const startEditContact = (item) => {
    setEditingContact(item);
    setEditName(item.name);
    setEditMobile(item.mobile);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName || !editMobile) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      await updateSecretContact({ id: editingContact._id, name: editName, mobile: editMobile }).unwrap();
      Alert.alert('Success', 'Contact updated successfully');
      setEditModalVisible(false);
      setEditingContact(null);
    } catch (err) {
      Alert.alert('Error', err.data?.message || 'Failed to update contact');
    }
  };

  const confirmClearChat = (receiverId, name) => {
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete all chat messages with ${name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => handleClearChat(receiverId), style: 'destructive' }
      ]
    );
  };

  const handleClearChat = async (receiverId) => {
    try {
      await clearChatHistory(receiverId).unwrap();
      Alert.alert('Success', 'Chat history cleared');
    } catch (err) {
      Alert.alert('Error', err.data?.message || 'Failed to clear chat history');
    }
  };

  const handleToggleMute = async (userId, currentlyMuted) => {
    try {
      if (currentlyMuted) {
        await unmuteUser({ userId }).unwrap();
        Alert.alert('Success', 'Notifications unmuted');
      } else {
        await muteUser({ userId }).unwrap();
        Alert.alert('Success', 'Notifications muted');
      }
    } catch (err) {
      Alert.alert('Error', err.data?.message || 'Failed to toggle mute state');
    }
  };

  const handleToggleBlock = async (userId, currentlyBlocked) => {
    try {
      if (currentlyBlocked) {
        await unblockUser({ userId }).unwrap();
        Alert.alert('Success', 'User unblocked');
      } else {
        await blockUser({ userId }).unwrap();
        Alert.alert('Success', 'User blocked');
      }
    } catch (err) {
      Alert.alert('Error', err.data?.message || 'Failed to toggle block state');
    }
  };

  const confirmReportUser = (userId, name) => {
    Alert.alert(
      'Report & Block User',
      `Are you sure you want to report ${name}? Reporting will automatically block this user and report their behavior to admins.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', onPress: () => handleReportUser(userId), style: 'destructive' }
      ]
    );
  };

  const handleReportUser = async (userId) => {
    try {
      await reportUser({ userId }).unwrap();
      Alert.alert('Success', 'User reported and blocked');
    } catch (err) {
      Alert.alert('Error', err.data?.message || 'Failed to report user');
    }
  };

  const confirmRemoveContact = (id, name) => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove ${name} from your Next Step contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => handleRemoveContact(id), style: 'destructive' }
      ]
    );
  };

  const handleRemoveContact = async (id) => {
    try {
      await deleteSecretContact(id).unwrap();
      Alert.alert('Success', 'Contact removed');
    } catch (err) {
      Alert.alert('Error', err.data?.message || 'Failed to remove contact');
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
              onLongPress={() => handleLongPressContact(item)}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={[styles.contactName, { color: c.text }]}>{item.name}</Text>
                  {item.isPinned && <Ionicons name="pin" size={13} color="#2563EB" style={{ transform: [{ rotate: '45deg' }] }} />}
                  {item.isBlocked && (
                    <View style={[styles.blockedBadge, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                      <Text style={[styles.blockedBadgeText, { color: c.subText }]}>Blocked</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.contactPreview, { color: c.subText }]} numberOfLines={1}>
                  {item.contactUserId
                    ? (item.lastMessage?.message || 'No messages yet')
                    : `Not on Next Step • ${item.mobile}`}
                </Text>
              </View>

              {/* Right Side Info (Time + Mute + Unread Badge) */}
              {item.contactUserId && (
                <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 5, paddingLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {item.isMuted && <Ionicons name="volume-mute" size={13} color={c.subText} style={{ marginRight: 2 }} />}
                    {item.lastMessage?.createdAt ? (
                      <Text style={[styles.contactTime, { color: c.subText }]}>
                        {formatTime(item.lastMessage.createdAt)}
                      </Text>
                    ) : null}
                  </View>
                  {item.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  ) : item.isMarkedUnread ? (
                    <View style={styles.unreadGreenDot} />
                  ) : null}
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
                <Ionicons name="close" size={24} color={c.text} />
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

      {/* ── Edit Contact Modal ── */}
      <Modal animationType="slide" transparent visible={editModalVisible} onRequestClose={() => { setEditModalVisible(false); setEditingContact(null); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Edit Contact</Text>
              <TouchableOpacity onPress={() => { setEditModalVisible(false); setEditingContact(null); }}>
                <Ionicons name="close" size={24} color={c.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: c.subText }]}>Name</Text>
            <View style={[styles.modalInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
              <Ionicons name="person-outline" size={17} color={c.icon} />
              <TextInput
                style={[styles.modalInputText, { color: c.text }]}
                placeholder="Enter contact name"
                placeholderTextColor={c.placeholder}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <Text style={[styles.modalLabel, { color: c.subText }]}>Mobile Number</Text>
            <View style={[styles.modalInput, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
              <Ionicons name="call-outline" size={17} color={c.icon} />
              <TextInput
                style={[styles.modalInputText, { color: c.text }]}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor={c.placeholder}
                value={editMobile}
                onChangeText={setEditMobile}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveEdit}
              style={styles.modalBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Contact Options Modal ── */}
      <Modal animationType="fade" transparent visible={optionsModalVisible} onRequestClose={() => setOptionsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>{selectedContact?.name}</Text>
              <TouchableOpacity onPress={() => setOptionsModalVisible(false)}>
                <Ionicons name="close" size={24} color={c.text} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginTop: 10 }}>
              {/* Option: Pin/Unpin */}
              <TouchableOpacity
                onPress={() => {
                  setOptionsModalVisible(false);
                  handleTogglePin(selectedContact._id, selectedContact.isPinned);
                }}
                style={[styles.optionRow, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
              >
                <Ionicons name="pin-outline" size={20} color="#2563EB" />
                <Text style={[styles.optionText, { color: c.text }]}>
                  {selectedContact?.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                </Text>
              </TouchableOpacity>

              {/* Option: Add Contact (virtual) or Edit Contact (saved) */}
              <TouchableOpacity
                onPress={() => {
                  setOptionsModalVisible(false);
                  if (selectedContact?.isVirtual) {
                    setNewContactName('');
                    setNewContactMobile(selectedContact.mobile);
                    setModalVisible(true);
                  } else {
                    startEditContact(selectedContact);
                  }
                }}
                style={[styles.optionRow, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
              >
                <Ionicons name="pencil-outline" size={20} color="#2563EB" />
                <Text style={[styles.optionText, { color: c.text }]}>
                  {selectedContact?.isVirtual ? 'Add Contact' : 'Edit Contact'}
                </Text>
              </TouchableOpacity>

              {selectedContact?.contactUserId && (
                <>
                  {/* Option: Mark Read/Unread */}
                  <TouchableOpacity
                    onPress={() => {
                      setOptionsModalVisible(false);
                      handleToggleUnread(selectedContact);
                    }}
                    style={[styles.optionRow, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
                  >
                    <Ionicons name="mail-outline" size={20} color="#2563EB" />
                    <Text style={[styles.optionText, { color: c.text }]}>
                      {selectedContact?.unreadCount > 0 || selectedContact?.isMarkedUnread ? 'Mark as Read' : 'Mark as Unread'}
                    </Text>
                  </TouchableOpacity>

                  {/* Option: Delete Chat */}
                  <TouchableOpacity
                    onPress={() => {
                      setOptionsModalVisible(false);
                      confirmClearChat(selectedContact.contactUserId._id, selectedContact.name);
                    }}
                    style={[styles.optionRow, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete Chat</Text>
                  </TouchableOpacity>

                  {/* Option: Mute/Unmute */}
                  <TouchableOpacity
                    onPress={() => {
                      setOptionsModalVisible(false);
                      handleToggleMute(selectedContact.contactUserId._id, selectedContact.isMuted);
                    }}
                    style={[styles.optionRow, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
                  >
                    <Ionicons name={selectedContact?.isMuted ? "volume-high-outline" : "volume-mute-outline"} size={20} color="#2563EB" />
                    <Text style={[styles.optionText, { color: c.text }]}>
                      {selectedContact?.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                    </Text>
                  </TouchableOpacity>

                  {/* Option: Block/Unblock */}
                  <TouchableOpacity
                    onPress={() => {
                      setOptionsModalVisible(false);
                      handleToggleBlock(selectedContact.contactUserId._id, selectedContact.isBlocked);
                    }}
                    style={[styles.optionRow, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
                  >
                    <Ionicons name="ban-outline" size={20} color="#EF4444" />
                    <Text style={[styles.optionText, { color: '#EF4444' }]}>
                      {selectedContact?.isBlocked ? 'Unblock User' : 'Block User'}
                    </Text>
                  </TouchableOpacity>

                  {/* Option: Report */}
                  <TouchableOpacity
                    onPress={() => {
                      setOptionsModalVisible(false);
                      confirmReportUser(selectedContact.contactUserId._id, selectedContact.name);
                    }}
                    style={[styles.optionRow, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
                  >
                    <Ionicons name="warning-outline" size={20} color="#EF4444" />
                    <Text style={[styles.optionText, { color: '#EF4444' }]}>Report & Block</Text>
                  </TouchableOpacity>
                </>
              )}

              {!selectedContact?.contactUserId && (
                <TouchableOpacity
                  onPress={() => {
                    setOptionsModalVisible(false);
                    handleInviteWhatsApp(selectedContact.mobile);
                  }}
                  style={[styles.optionRow, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#22C55E" />
                  <Text style={[styles.optionText, { color: c.text }]}>Invite via WhatsApp</Text>
                </TouchableOpacity>
              )}

              {/* Option: Remove Contact (only for saved contacts) */}
              {!selectedContact?.isVirtual && (
                <TouchableOpacity
                  onPress={() => {
                    setOptionsModalVisible(false);
                    confirmRemoveContact(selectedContact._id, selectedContact.name);
                  }}
                  style={[styles.optionRow, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
                >
                  <Ionicons name="person-remove-outline" size={20} color="#EF4444" />
                  <Text style={[styles.optionText, { color: '#EF4444' }]}>Remove Contact</Text>
                </TouchableOpacity>
              )}
            </View>
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
  blockedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  blockedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  unreadGreenDot: {
    backgroundColor: '#10B981',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
    marginTop: 4,
  },
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
