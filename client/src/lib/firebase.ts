import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableNetwork, disableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Check for network status and manage Firestore connectivity
export const checkNetworkStatus = async () => {
  const isOnline = navigator.onLine;
  console.log(`Network status: ${isOnline ? 'Online' : 'Offline'}`);
  
  try {
    if (!isOnline) {
      console.log('Network disconnected. Disabling Firestore.');
      await disableNetwork(db);
      return false;
    } else {
      console.log('Network connected. Enabling Firestore.');
      await enableNetwork(db);
      // Try to refresh the auth token when coming back online
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await currentUser.getIdToken(true);
          console.log('Auth token refreshed after reconnecting');
        } catch (tokenError) {
          console.warn('Failed to refresh token after reconnecting:', tokenError);
        }
      }
      return true;
    }
  } catch (error) {
    console.error('Error managing Firestore network status:', error);
    return isOnline;
  }
};

// Set up network status listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('Browser went online');
    await checkNetworkStatus();
  });
  
  window.addEventListener('offline', async () => {
    console.log('Browser went offline');
    await checkNetworkStatus();
  });
  
  // Initial network check
  checkNetworkStatus();
} 