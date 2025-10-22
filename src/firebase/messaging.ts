import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseApp } from './config';

export const messaging = getMessaging(firebaseApp);

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY 
      });
      
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('No notification permission granted.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      resolve(payload);
    });
  });
};