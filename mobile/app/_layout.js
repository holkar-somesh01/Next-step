import React, { useEffect, useRef } from 'react';
import { Stack, usePathname, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from '../redux/store';
import { ThemeProvider } from '../context/ThemeContext';
import { setChatUnlocked, setAppUnlocked, selectCurrentUser } from '../redux/slices/authSlice';
import { AppState } from 'react-native';
import MainAppLock from '../components/MainAppLock';
import NotificationController from '../components/NotificationController';

function AppStateNavigator() {
  const pathname = usePathname();
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const pathnameRef = useRef(pathname);
  const userRef = useRef(user);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        const currentPath = pathnameRef.current;
        const currentUser = userRef.current;

        // Always lock chats when leaving the app
        dispatch(setChatUnlocked(false));

        if (currentPath && currentPath.startsWith('/chats')) {
          if (currentUser?.hasAppLockCode) {
            // User has app lock: lock app and redirect to schemes page
            dispatch(setAppUnlocked(false));
            router.replace('/(tabs)/schemes');
          } else {
            // User does not have app lock: do not lock app, and redirect to home screen directly
            dispatch(setAppUnlocked(true));
            router.replace('/(tabs)/');
          }
        } else {
          // Standard locking behavior if not on chat screen
          if (currentUser?.hasAppLockCode) {
            dispatch(setAppUnlocked(false));
          } else {
            dispatch(setAppUnlocked(true));
          }
        }
      }
    });
    return () => sub.remove();
  }, [dispatch]);

  return null;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <NotificationController>
          <MainAppLock>
            <AppStateNavigator />
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
