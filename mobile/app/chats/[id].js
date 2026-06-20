import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, StyleSheet,
  Alert, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import {
  useGetChatHistoryQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation
} from '../../redux/api/chatApi';
import { useGetUserByIdQuery } from '../../redux/api/userApi';
import { useTheme } from '../../context/ThemeContext';
import io from 'socket.io-client';
import AppLock from '../../components/AppLock';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');
const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');

const EMOJI_LIST = [
  '😀','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪',
  '🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺',
  '😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥',
  '😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧',
  '😷','🤒','🤕','🤑','🤠','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗',
  '💖','💘','💝','💟','💌','🎨','🎭','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','🎯','🎳',
  '🎮','🎰'
];

export default function ChatDetailScreen() {
  const { id: receiverId, contactName } = useLocalSearchParams();
  const router = useRouter();
  const currentUser = useSelector(selectCurrentUser);
  const { isDark, colors: c } = useTheme();

  const [message, setMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const socket = useRef(null);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const { data: receiver } = useGetUserByIdQuery(receiverId, {
    skip: !receiverId || !currentUser,
  });

  const { data: history, isLoading } = useGetChatHistoryQuery(receiverId, {
    skip: !receiverId || !currentUser,
    refetchOnMountOrArgChange: true,
  });

  const [sendMsgMutation] = useSendMessageMutation();
  const [editMsgMutation] = useEditMessageMutation();
  const [deleteMsgMutation] = useDeleteMessageMutation();
  const [chatMessages, setChatMessages] = useState([]);

  const roomId = currentUser && receiverId
    ? [currentUser._id, receiverId].sort().join('_')
    : null;

  useEffect(() => {
    if (!currentUser) router.replace('/(auth)/login');
  }, [currentUser]);

  useEffect(() => {
    if (history) setChatMessages(history);
  }, [history]);

  useEffect(() => {
    if (!roomId) return;
    socket.current = io(SOCKET_URL);
    socket.current.emit('join_room', roomId);
    
    socket.current.on('receive_message', (data) => {
      setChatMessages(prev => [...prev, data]);
    });

    socket.current.on('message_edited', (data) => {
      setChatMessages(prev =>
        prev.map(m => (m._id === data.messageId ? { ...m, message: data.message } : m))
      );
    });

    socket.current.on('message_deleted', (data) => {
      setChatMessages(prev => prev.filter(m => m._id !== data.messageId));
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [roomId]);

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    } else {
      Keyboard.dismiss();
      setTimeout(() => {
        setShowEmojiPicker(true);
      }, 100);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !currentUser || !roomId) return;

    if (editingMessageId) {
      // Edit message flow
      try {
        await editMsgMutation({ messageId: editingMessageId, message: message.trim() }).unwrap();
        socket.current.emit('edit_message', { messageId: editingMessageId, message: message.trim(), room: roomId });
        setChatMessages(prev =>
          prev.map(m => (m._id === editingMessageId ? { ...m, message: message.trim() } : m))
        );
        setEditingMessageId(null);
        setMessage('');
      } catch (err) {
        console.error('Failed to edit message:', err);
        Alert.alert('Error', 'Failed to edit message');
      }
    } else {
      // Send new message flow
      const tempId = `temp-${Date.now()}`;
      const messageData = {
        _id: tempId,
        sender: currentUser._id,
        receiver: receiverId,
        message: message.trim(),
        room: roomId,
        createdAt: new Date().toISOString(),
      };
      
      // Optimitic update
      setChatMessages(prev => [...prev, messageData]);
      setMessage('');
      
      try {
        const result = await sendMsgMutation({ receiverId, message: messageData.message, room: roomId }).unwrap();
        socket.current.emit('send_message', result);
        
        // Swap temp message with official database record containing real _id
        setChatMessages(prev =>
          prev.map(m => (m._id === tempId ? result : m))
        );
      } catch (err) {
        console.error('Failed to send message:', err);
        // Rollback optimistic update on error
        setChatMessages(prev => prev.filter(m => m._id !== tempId));
      }
    }
  };

  const handleLongPressMessage = (msg) => {
    // Only allow editing/deleting if the message belongs to the current user
    const isMine = msg.sender === currentUser._id;
    if (!isMine) return;

    Alert.alert(
      'Message Options',
      'Choose an action',
      [
        { text: 'Edit', onPress: () => startEditMessage(msg) },
        { text: 'Delete', onPress: () => confirmDeleteMessage(msg._id), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const startEditMessage = (msg) => {
    setEditingMessageId(msg._id);
    setMessage(msg.message);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const confirmDeleteMessage = (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to permanently delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => handleDeleteMessage(messageId), style: 'destructive' }
      ]
    );
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMsgMutation(messageId).unwrap();
      socket.current.emit('delete_message', { messageId, room: roomId });
      setChatMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!currentUser) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <AppLock>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>

          {/* ── Header ── */}
          <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.cardBorder }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: isDark ? '#252540' : '#F1F5F9' }]}
            >
              <Ionicons name="chevron-back" size={22} color={c.text} />
            </TouchableOpacity>

            <View style={[styles.receiverAvatar, { backgroundColor: isDark ? '#1e2a45' : '#EFF6FF' }]}>
              {receiver?.profileImage ? (
                <Image source={{ uri: `${BASE_URL}${receiver.profileImage}` }} style={styles.receiverAvatarImg} />
              ) : (
                <Text style={styles.receiverAvatarText}>{getInitials(contactName || receiver?.name)}</Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.receiverName, { color: c.text }]} numberOfLines={1}>
                {contactName || receiver?.name || '...'}
              </Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={[styles.onlineText, { color: c.subText }]}>Active now</Text>
              </View>
            </View>
          </View>

          {/* ── Messages ── */}
          <View style={[styles.messagesArea, { backgroundColor: isDark ? '#0c0c1a' : '#F8FAFC' }]}>
            {isLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={chatMessages}
                keyExtractor={(item, index) => item._id || index.toString()}
                contentContainerStyle={{ padding: 18, paddingBottom: 24 }}
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={() => {
                  Keyboard.dismiss();
                  setShowEmojiPicker(false);
                }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                  const isMine = item.sender === currentUser._id;
                  return (
                    <View style={[styles.msgRow, { justifyContent: isMine ? 'flex-end' : 'flex-start' }]}>
                      <TouchableOpacity
                        activeOpacity={isMine ? 0.8 : 1}
                        onLongPress={() => handleLongPressMessage(item)}
                        style={[
                          styles.msgBubble,
                          isMine
                            ? { backgroundColor: '#2563EB', borderTopRightRadius: 4 }
                            : {
                                backgroundColor: c.card,
                                borderTopLeftRadius: 4,
                                borderWidth: 1,
                                borderColor: c.cardBorder,
                              },
                        ]}
                      >
                        <Text style={[styles.msgText, { color: isMine ? '#fff' : c.text }]}>
                          {item.message}
                        </Text>
                        <View style={styles.msgMeta}>
                          <Text style={[styles.msgTime, { color: isMine ? 'rgba(255,255,255,0.6)' : c.subText }]}>
                            {formatTime(item.createdAt)}
                          </Text>
                          {isMine && <Ionicons name="checkmark-done" size={11} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )}
          </View>

          {/* ── Editing Indicator Banner ── */}
          {editingMessageId && (
            <View style={[styles.editingBanner, { backgroundColor: isDark ? '#1e1e35' : '#F1F5F9', borderTopColor: c.cardBorder }]}>
              <Ionicons name="pencil" size={15} color="#2563EB" />
              <Text style={[styles.editingText, { color: c.text }]}>Editing message...</Text>
              <TouchableOpacity 
                onPress={() => { setEditingMessageId(null); setMessage(''); }}
                style={styles.cancelEditBtn}
              >
                <Ionicons name="close-circle" size={18} color={c.subText} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Input Bar ── */}
          <View style={[styles.inputBar, { backgroundColor: c.card, borderTopColor: c.cardBorder }]}>
            <View style={[styles.inputBox, { backgroundColor: isDark ? '#252540' : '#F1F5F9', borderColor: c.cardBorder }]}>
              <TextInput
                ref={inputRef}
                placeholder="Type your message..."
                placeholderTextColor={c.placeholder}
                style={[styles.input, { color: c.text }]}
                multiline
                value={message}
                onChangeText={setMessage}
                onFocus={() => setShowEmojiPicker(false)}
              />
              <TouchableOpacity 
                onPress={toggleEmojiPicker}
                style={styles.emojiToggleBtn}
                activeOpacity={0.7}
              >
                <Ionicons name={showEmojiPicker ? "keyboard" : "happy-outline"} size={22} color={c.icon} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!message.trim()}
              style={[
                styles.sendBtn,
                { backgroundColor: message.trim() ? '#2563EB' : (isDark ? '#252540' : '#E2E8F0') },
              ]}
              activeOpacity={0.85}
            >
              <Ionicons 
                name={editingMessageId ? "checkmark" : "paper-plane"} 
                size={18} 
                color={message.trim() ? '#fff' : c.icon} 
              />
            </TouchableOpacity>
          </View>

          {/* ── Emoji Picker Drawer ── */}
          {showEmojiPicker && (
            <View style={[styles.emojiPickerContainer, { backgroundColor: c.card, borderTopColor: c.cardBorder }]}>
              <View style={[styles.emojiModalHeader, { borderBottomColor: c.cardBorder }]}>
                <Text style={[styles.emojiTitle, { color: c.text }]}>Emojis</Text>
                <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                  <Ionicons name="close" size={22} color={c.text} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={EMOJI_LIST}
                numColumns={7}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ padding: 8 }}
                style={{ flex: 1 }}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    onPress={() => setMessage(prev => prev + item)}
                    style={styles.emojiGridCell}
                  >
                    <Text style={{ fontSize: 28 }}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AppLock>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  receiverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  receiverAvatarImg: { width: '100%', height: '100%' },
  receiverAvatarText: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
  receiverName: { fontSize: 15, fontWeight: '700' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  onlineText: { fontSize: 11, fontWeight: '600' },

  messagesArea: { flex: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 14 },
  msgBubble: {
    maxWidth: '82%',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 5 },
  msgTime: { fontSize: 10, fontWeight: '500' },

  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  editingText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cancelEditBtn: {
    padding: 2,
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, gap: 8,
  },
  inputBox: {
    flex: 1, borderRadius: 22,
    paddingLeft: 16, paddingRight: 8, paddingVertical: 4,
    borderWidth: 1, maxHeight: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: { flex: 1, fontSize: 14, padding: 0, minHeight: 24, marginVertical: 6 },
  emojiToggleBtn: {
    padding: 6,
    marginBottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Emoji Drawer */
  emojiPickerContainer: {
    height: 250,
    borderTopWidth: 1,
  },
  emojiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  emojiTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emojiGridCell: {
    flex: 1 / 7,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
