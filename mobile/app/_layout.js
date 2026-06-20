import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { ThemeProvider } from '../context/ThemeContext';
import { setChatUnlocked, setAppUnlocked } from '../redux/slices/authSlice';
import { AppState } from 'react-native';
import MainAppLock from '../components/MainAppLock';
import NotificationController from '../components/NotificationController';

export default function RootLayout() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        store.dispatch(setChatUnlocked(false));
        store.dispatch(setAppUnlocked(false));
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <NotificationController>
          <MainAppLock>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/signup" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="about" options={{ presentation: 'card' }} />
              <Stack.Screen name="contact" options={{ presentation: 'card' }} />
              <Stack.Screen name="settings" options={{ presentation: 'card' }} />
              <Stack.Screen name="chats/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="chats/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </MainAppLock>
        </NotificationController>
      </ThemeProvider>
    </Provider>
  );
}
