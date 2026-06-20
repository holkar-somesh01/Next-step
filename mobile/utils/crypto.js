import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Generate a new X25519 key pair for E2EE and store the private key securely.
 * @param {string} userId - The user ID to namespace the private key in secure storage.
 * @returns {Promise<{publicKey: string, privateKey: string}>} Base64 encoded keys
 */
export const generateAndStoreKeyPair = async (userId) => {
  const keyPair = nacl.box.keyPair();
  const publicKeyBase64 = naclUtil.encodeBase64(keyPair.publicKey);
  const privateKeyBase64 = naclUtil.encodeBase64(keyPair.secretKey);

  const storageKey = `e2ee_private_key_${userId}`;
  
  if (isWeb) {
    localStorage.setItem(storageKey, privateKeyBase64);
  } else {
    await SecureStore.setItemAsync(storageKey, privateKeyBase64);
  }

  return { publicKey: publicKeyBase64, privateKey: privateKeyBase64 };
};

/**
 * Retrieve the user's private key from secure storage.
 * @param {string} userId - The user ID.
 * @returns {Promise<string|null>} Base64 encoded private key or null if not found
 */
export const getPrivateKey = async (userId) => {
  const storageKey = `e2ee_private_key_${userId}`;
  if (isWeb) {
    return localStorage.getItem(storageKey);
  } else {
    return await SecureStore.getItemAsync(storageKey);
  }
};

/**
 * Encrypt a plaintext message.
 * Uses X25519 for key agreement and XSalsa20-Poly1305 for authenticated encryption (NaCl box).
 * 
 * @param {string} message - Plaintext message
 * @param {string} receiverPublicKeyBase64 - Receiver's public key (Base64)
 * @param {string} senderPrivateKeyBase64 - Sender's private key (Base64)
 * @returns {{ encryptedContent: string, iv: string }}
 */
export const encryptMessage = (message, receiverPublicKeyBase64, senderPrivateKeyBase64) => {
  const receiverPublicKey = naclUtil.decodeBase64(receiverPublicKeyBase64);
  const senderPrivateKey = naclUtil.decodeBase64(senderPrivateKeyBase64);
  
  const messageUint8 = naclUtil.decodeUTF8(message);
  
  // Generate a secure random nonce (iv) of 24 bytes
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  
  // Encrypt
  const encrypted = nacl.box(messageUint8, nonce, receiverPublicKey, senderPrivateKey);
  
  return {
    encryptedContent: naclUtil.encodeBase64(encrypted),
    iv: naclUtil.encodeBase64(nonce)
  };
};

/**
 * Decrypt an encrypted message.
 * 
 * @param {string} encryptedContentBase64 - Encrypted message payload (Base64)
 * @param {string} ivBase64 - The nonce/IV used for encryption (Base64)
 * @param {string} senderPublicKeyBase64 - Sender's public key (Base64)
 * @param {string} receiverPrivateKeyBase64 - Receiver's private key (Base64)
 * @returns {string|null} Plaintext message or null if decryption fails
 */
export const decryptMessage = (encryptedContentBase64, ivBase64, senderPublicKeyBase64, receiverPrivateKeyBase64) => {
  try {
    const encryptedContent = naclUtil.decodeBase64(encryptedContentBase64);
    const nonce = naclUtil.decodeBase64(ivBase64);
    const senderPublicKey = naclUtil.decodeBase64(senderPublicKeyBase64);
    const receiverPrivateKey = naclUtil.decodeBase64(receiverPrivateKeyBase64);

    const decryptedUint8 = nacl.box.open(encryptedContent, nonce, senderPublicKey, receiverPrivateKey);
    
    if (!decryptedUint8) {
      console.error('E2EE Decryption failed (invalid key or corrupted payload)');
      return null;
    }
    
    return naclUtil.encodeUTF8(decryptedUint8);
  } catch (error) {
    console.error('E2EE Decryption error:', error);
    return null;
  }
};
