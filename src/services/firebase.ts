/**
 * Firebase Initialization - App, Auth, Firestore, and Storage Setup
 *
 * This file initializes and exports the four core Firebase services used by The Vine:
 * 1. app - The Firebase app instance (the root of all Firebase services)
 * 2. auth - Firebase Authentication (handles user sign-up, login, and session management)
 * 3. db - Cloud Firestore (the NoSQL database that stores family members, feed items, etc.)
 * 4. storage - Firebase Storage (stores uploaded photos and media files)
 *
 * Configuration values are loaded from environment variables (set in .env file with
 * EXPO_PUBLIC_ prefix so Expo bundles them into the app). Fallback placeholder strings
 * are provided for development but must be replaced with real values before deployment.
 *
 * Special handling:
 * - The app checks if a Firebase app already exists (via getApps()) to prevent
 *   re-initialization errors during Expo's hot-reload development cycle.
 * - Auth uses AsyncStorage for session persistence so users stay logged in
 *   between app restarts (instead of losing their session when the app closes).
 * - The initializeAuth/getAuth try-catch pattern handles hot-reload safely:
 *   initializeAuth throws if called twice, so we fall back to getAuth.
 */

// Firebase SDK imports for app initialization
import { initializeApp, getApps } from 'firebase/app';
// Auth imports: initializeAuth for first-time setup, getAuth as fallback for hot-reload
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// @ts-expect-error - getReactNativePersistence is available via Metro's react-native resolution
// This import has a TypeScript error because the types don't expose it, but it works at runtime
import { getReactNativePersistence } from 'firebase/auth';
// Firestore import for the NoSQL database
import { getFirestore } from 'firebase/firestore';
// Storage import for file/media uploads
import { getStorage } from 'firebase/storage';
// AsyncStorage is used to persist the auth session on the device between app launches
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration object - values are loaded from environment variables.
// Each EXPO_PUBLIC_ variable is set in the .env file and bundled by Expo at build time.
// The fallback strings (e.g., 'YOUR_API_KEY') serve as reminders during initial setup.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY', // The Firebase Web API key (used for authenticating API requests)
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN', // The domain for Firebase Auth (e.g., "your-project.firebaseapp.com")
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID', // The unique Firebase project identifier
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET', // The Cloud Storage bucket URL for file uploads
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID', // The sender ID for Firebase Cloud Messaging (push notifications)
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID', // The unique identifier for this Firebase app
};

// Initialize the Firebase app instance.
// getApps() returns all initialized apps. If none exist (length === 0), we initialize a new one.
// If one already exists (e.g., after a hot-reload), we reuse the existing instance.
// This prevents the "Firebase App already exists" error during development.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication with React Native persistence.
// We use AsyncStorage as the persistence layer so the user's login session is saved
// to the device and survives app restarts (the user stays logged in).
//
// The try-catch pattern is needed because initializeAuth throws an error if called
// more than once on the same app instance (which happens during Expo hot-reloads).
// If initializeAuth fails, we fall back to getAuth which returns the already-initialized instance.
let auth: Auth;
try {
  // First attempt: initialize auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage), // Save auth state to device storage
  });
} catch {
  // Fallback: if auth was already initialized (hot-reload), just get the existing instance
  auth = getAuth(app);
}

// Initialize Cloud Firestore - the NoSQL document database.
// This is used to store and query family members, feed items, comments, prompts, etc.
const db = getFirestore(app);

// Initialize Firebase Storage - the file storage service.
// This is used to upload and serve user photos, media attachments, and profile images.
const storage = getStorage(app);

// Export all four Firebase services for use throughout the app.
// Other files import these like: import { auth, db } from '../services/firebase';
export { app, auth, db, storage };
