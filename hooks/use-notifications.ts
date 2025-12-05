import { authService } from '@/api/services';
import { logger } from '@/utils/logger';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications(enabled: boolean = true) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        // Save token to user profile
        savePushTokenToProfile(token);
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      logger.info('📬 Notification received', notification);
      setNotification(notification);
    });

    // Listen for user tapping on or interacting with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.info('📱 Notification tapped', response);
      handleNotificationResponse(response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [enabled]);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync() {
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
      logger.warn('❌ Failed to get push token for push notification!');
      return null;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      logger.warn('❌ Project ID not found');
      return null;
    }

    try {
      const pushTokenString = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      return pushTokenString;
    } catch (e: unknown) {
      logger.error('❌ Error getting push token', e);
      return null;
    }
  } else {
    logger.warn('❌ Push notifications are not supported on this device');
    return null;
  }
}

async function savePushTokenToProfile(token: string) {
  try {
    const { user } = await authService.getCurrentUser();
    if (!user) {
      return null;
    }

    // Check if token is already saved
    if (user.expo_push_token === token) {
      return null;
    }

    const { error } = await authService.updateProfile({ expo_push_token: token });
    if (error) {
      logger.error('❌ Error saving push token', error);
    }
  } catch (error) {
    logger.error('❌ Error in savePushTokenToProfile', error);
  }
}

function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const { notification } = response;
  const data = notification.request.content.data;

  if (!data || typeof data !== 'object') {
    return;
  }

  const { type, metadata } = data as { type?: string; metadata?: Record<string, unknown> };

  try {
    switch (type) {
      case 'message': {
        // Navigate to messages screen or specific conversation
        if (metadata?.conversation_id) {
          router.push(`/message/${metadata.conversation_id}`);
        } else {
          router.push('/(tabs)/messages');
        }
        break;
      }

      case 'offer_created': {
        // Navigate to seller offers screen
        router.push('/seller/offers');
        break;
      }

      case 'offer_accepted':
      case 'offer_declined': {
        // Navigate to buyer offers screen or specific offer
        if (metadata?.offer_id) {
          router.push(`/other/offers`);
        } else {
          router.push('/other/offers');
        }
        break;
      }

      default: {
        break;
      }
    }
  } catch (error) {
    logger.error('❌ Error navigating from notification', error);
  }
}
