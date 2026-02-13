/**
 * authStore.ts - Authentication Store
 *
 * This Zustand store manages all Firebase Authentication state and actions
 * for The Vine app. It handles:
 *   - User login (email + password)
 *   - User signup (email + password + display name)
 *   - User logout
 *   - Password reset via email
 *   - Listening for auth state changes (e.g., when the app starts or the
 *     user signs in/out in another tab)
 *
 * The store maintains two representations of the user:
 *   1. `firebaseUser` - the raw Firebase Auth user object (used for auth operations)
 *   2. `user` - a simplified app-level User object (used by UI components)
 *
 * The `initialize` method sets up a real-time listener on Firebase Auth so
 * that the store automatically updates whenever the user's auth state changes.
 */

import { create } from 'zustand'; // Zustand is a lightweight state management library for React
import {
  signInWithEmailAndPassword, // Firebase function to sign in an existing user
  createUserWithEmailAndPassword, // Firebase function to create a new user account
  signOut, // Firebase function to sign the current user out
  sendPasswordResetEmail, // Firebase function to send a password reset email
  onAuthStateChanged, // Firebase listener that fires whenever auth state changes
  updateProfile, // Firebase function to update the user's profile (e.g., display name)
  User as FirebaseUser, // The Firebase User type, aliased to avoid conflict with our app's User type
} from 'firebase/auth';
import { auth } from '../services/firebase'; // The initialized Firebase Auth instance
import { User } from '../types'; // The app's simplified User type

/**
 * Converts a Firebase Auth user object into the app's simplified User format.
 * This strips away Firebase-specific details and keeps only what the UI needs.
 *
 * @param firebaseUser - The raw Firebase Auth user object
 * @returns A simplified User object with id, email, displayName, photoURL, and timestamps
 */
function firebaseUserToUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid, // Use Firebase's unique user ID as the app user ID
    email: firebaseUser.email || '', // Fall back to empty string if email is null
    displayName: firebaseUser.displayName || '', // Fall back to empty string if no display name set
    photoURL: firebaseUser.photoURL || undefined, // Convert null to undefined for optional field
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()), // When the account was created
    updatedAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()), // When the user last signed in
  };
}

/**
 * Safely extracts the error code string from a Firebase Auth error.
 * Firebase errors have a `code` property (e.g., 'auth/wrong-password'),
 * but since errors are typed as `unknown`, we need to safely check for it.
 *
 * @param err - The caught error (typed as unknown)
 * @returns The Firebase error code string, or 'unknown' if it cannot be extracted
 */
const getFirebaseErrorCode = (err: unknown): string =>
  typeof err === 'object' && err !== null && 'code' in err // Check that err is a non-null object with a 'code' property
    ? String((err as { code: unknown }).code) // Cast and extract the code as a string
    : 'unknown'; // Default to 'unknown' if the error does not have a code

/**
 * Maps Firebase Auth error codes to user-friendly error messages.
 * These messages are displayed in the UI so they should be clear and helpful
 * for non-technical users.
 *
 * @param code - The Firebase Auth error code (e.g., 'auth/wrong-password')
 * @returns A human-readable error message string
 */
function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email': // The email address format is invalid
      return 'Please enter a valid email address.';
    case 'auth/user-disabled': // The user account has been disabled by an admin
      return 'This account has been disabled.';
    case 'auth/user-not-found': // No account exists with this email
      return 'No account found with this email.';
    case 'auth/wrong-password': // The password is incorrect
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential': // Generic credential error (email or password wrong)
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use': // Another account already uses this email
      return 'An account with this email already exists.';
    case 'auth/weak-password': // The password does not meet minimum requirements
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests': // Rate limiting - too many failed attempts
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed': // No internet connection or network issue
      return 'Network error. Please check your connection.';
    default: // Any other unrecognized error code
      return 'Something went wrong. Please try again.';
  }
}

/**
 * TypeScript interface defining the shape of the auth store's state and actions.
 * This tells TypeScript (and developers) exactly what properties and methods
 * are available on the store.
 */
interface AuthState {
  user: User | null; // The app-level user object, or null if not authenticated
  firebaseUser: FirebaseUser | null; // The raw Firebase user, or null if not authenticated
  isAuthenticated: boolean; // Whether a user is currently signed in
  isLoading: boolean; // Whether an auth operation (login, signup, etc.) is in progress
  isInitialized: boolean; // Whether the auth state listener has fired at least once
  error: string | null; // The current error message to display, or null if no error
  login: (email: string, password: string) => Promise<void>; // Sign in an existing user
  signup: (email: string, password: string, displayName: string) => Promise<void>; // Create a new user account
  logout: () => Promise<void>; // Sign out the current user
  resetPassword: (email: string) => Promise<void>; // Send a password reset email
  clearError: () => void; // Clear the current error message
  initialize: () => () => void; // Set up the auth state listener; returns an unsubscribe function
}

/**
 * The Zustand auth store. Created with `create<AuthState>` which provides
 * a `set` function to update state. Components use this store via the
 * `useAuthStore` hook (e.g., `const { user, login } = useAuthStore()`).
 */
export const useAuthStore = create<AuthState>((set) => ({
  // --- Initial State ---
  user: null, // No user is signed in initially
  firebaseUser: null, // No Firebase user initially
  isAuthenticated: false, // Not authenticated until Firebase confirms
  isLoading: false, // No operation in progress initially
  isInitialized: false, // Auth listener has not fired yet
  error: null, // No error initially

  /**
   * Sets up a real-time listener on Firebase Auth state changes.
   * This should be called once when the app starts (typically in the root layout).
   * The listener fires immediately with the current auth state, and again
   * whenever the user signs in or out.
   *
   * @returns An unsubscribe function that should be called when the component unmounts
   *          to stop listening for auth changes and prevent memory leaks.
   */
  initialize: () => {
    // onAuthStateChanged returns an unsubscribe function; we store and return it
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // A user is signed in — update the store with their information
        set({
          user: firebaseUserToUser(firebaseUser), // Convert Firebase user to app user
          firebaseUser, // Store the raw Firebase user for auth operations
          isAuthenticated: true, // Mark as authenticated
          isLoading: false, // Any pending loading state is resolved
          isInitialized: true, // The listener has now fired at least once
        });
      } else {
        // No user is signed in — clear all user state
        set({
          user: null, // No app user
          firebaseUser: null, // No Firebase user
          isAuthenticated: false, // Not authenticated
          isLoading: false, // Any pending loading state is resolved
          isInitialized: true, // The listener has now fired at least once
        });
      }
    });
    return unsubscribe; // Return the cleanup function so the caller can stop listening
  },

  /**
   * Signs in an existing user with their email and password.
   * On success, the onAuthStateChanged listener (from initialize) will
   * automatically update the store with the user's info.
   * On failure, sets the error message in state for the UI to display.
   *
   * @param email - The user's email address
   * @param password - The user's password
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null }); // Show loading spinner; clear any previous error
    try {
      await signInWithEmailAndPassword(auth, email, password); // Attempt to sign in via Firebase
      // Note: We do NOT set isLoading: false here on success because the
      // onAuthStateChanged listener will fire and set isLoading: false for us.
    } catch (err: unknown) {
      // Sign-in failed — extract the error code and convert it to a user-friendly message
      set({ isLoading: false, error: getAuthErrorMessage(getFirebaseErrorCode(err)) });
    }
  },

  /**
   * Creates a new user account with email, password, and display name.
   * First creates the account, then updates the profile with the display name.
   * On success, the onAuthStateChanged listener will update the store.
   * On failure, sets the error message in state for the UI to display.
   *
   * @param email - The email address for the new account
   * @param password - The password for the new account (minimum 6 characters)
   * @param displayName - The user's display name (e.g., "Eli Herman")
   */
  signup: async (email, password, displayName) => {
    set({ isLoading: true, error: null }); // Show loading spinner; clear any previous error
    try {
      // Step 1: Create the user account in Firebase Auth
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      // Step 2: Set the display name on the newly created user's profile
      await updateProfile(firebaseUser, { displayName });
      // Note: onAuthStateChanged will fire automatically after account creation
    } catch (err: unknown) {
      // Account creation failed — show a user-friendly error message
      set({ isLoading: false, error: getAuthErrorMessage(getFirebaseErrorCode(err)) });
    }
  },

  /**
   * Signs out the current user from Firebase Auth.
   * On success, the onAuthStateChanged listener will fire and clear
   * all user state from the store automatically.
   * On failure, sets the error message in state.
   */
  logout: async () => {
    try {
      await signOut(auth); // Tell Firebase to sign the user out
      // Note: onAuthStateChanged will handle clearing user state
    } catch (err: unknown) {
      // Sign-out failed (rare, but possible with network issues)
      set({ error: getAuthErrorMessage(getFirebaseErrorCode(err)) });
    }
  },

  /**
   * Sends a password reset email to the specified email address.
   * Firebase will send an email with a link that lets the user set a new password.
   * This does NOT require the user to be currently signed in.
   *
   * @param email - The email address to send the password reset link to
   */
  resetPassword: async (email) => {
    set({ isLoading: true, error: null }); // Show loading spinner; clear any previous error
    try {
      await sendPasswordResetEmail(auth, email); // Send the reset email via Firebase
      set({ isLoading: false }); // Operation complete — stop showing loading spinner
    } catch (err: unknown) {
      // Reset failed — show a user-friendly error message
      set({ isLoading: false, error: getAuthErrorMessage(getFirebaseErrorCode(err)) });
    }
  },

  /**
   * Clears the current error message from state.
   * Typically called when the user dismisses an error alert or navigates away
   * from the screen where the error occurred.
   */
  clearError: () => set({ error: null }),
}));
