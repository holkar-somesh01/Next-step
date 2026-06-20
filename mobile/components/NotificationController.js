import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectCurrentToken } from '../redux/slices/authSlice';
import { useUpdatePushTokenMutation } from '../redux/api/userApi';

// Define the notification behavior when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationController({ children }) {
  const router = useRouter();
  const currentUser = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);
  const [updatePushToken] = useUpdatePushTokenMutation();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (!currentUser || !token) return;

    // Register push token
    registerForPushNotificationsAsync().then(pushToken => {
      if (pushToken) {
        updatePushToken({ expoPushToken: pushToken })
          .unwrap()
          .then(() => console.log('[Notification] Push token updated successfully:', pushToken))
          .catch(err => console.error('[Notification] Failed to update push token:', err));
      }
    });

    // Handle notifications received in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notification] Foreground message received:', notification);
    });

    // Handle clicks / taps on notifications (from background or cold start)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('[Notification] Click response data received:', data);
      if (data && data.schemeId) {
        setTimeout(() => {
          router.push(`/scheme/${data.schemeId}`);
        }, 500);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [currentUser, token]);

  return <>{children}</>;
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Notification] Failed to get push token permission!');
      return;
    }
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      if (!projectId) {
        console.warn(
          "[Notification] Warning: No EAS projectId found. Push notifications will not work. " +
          "Please create an Expo project or run 'eas project:init', then add your " +
          "projectId to your app.json under expo.extra.eas.projectId."
        );
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.error('[Notification] Error getting expo push token:', e);
    }
  } else {
    console.log('[Notification] Must use physical device for Push Notifications');
  }

  return token;
}
