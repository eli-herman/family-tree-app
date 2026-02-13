/**
 * userStore.ts - User Store
 *
 * This Zustand store links the currently authenticated Firebase Auth user
 * to their corresponding family member record in the family store.
 *
 * It handles:
 *   - Resolving which FamilyMember the signed-in Firebase user corresponds to
 *     (by matching the Firebase UID to a member's `userId` field)
 *   - Falling back to a default member ID ('eli') in development mode
 *   - Managing user preferences (e.g., notification settings)
 *   - Providing the `currentMemberId` that other stores (like familyStore)
 *     use to determine whose perspective to show (e.g., tree focus, feed filtering)
 *
 * This store reads from both the authStore (for the Firebase UID) and the
 * familyStore (for the list of family members) but does not write to either.
 */

import { create } from 'zustand'; // Zustand is a lightweight state management library for React
import { useAuthStore } from './authStore'; // Access the auth store to get the current Firebase user
import { useFamilyStore } from './familyStore'; // Access the family store to look up family members

/**
 * Interface defining the shape of user preferences.
 * Currently a placeholder with just one setting; will be expanded as
 * more preference options are added (e.g., theme, language, etc.).
 */
interface UserPreferences {
  // Placeholder for future preferences
  notificationsEnabled: boolean; // Whether push notifications are turned on
}

/**
 * TypeScript interface defining the shape of the user store's state and actions.
 */
interface UserState {
  currentMemberId: string | null; // The family member ID of the currently signed-in user, or null
  preferences: UserPreferences; // The user's app preference settings
  isLoading: boolean; // Whether user data is currently being resolved
  error: string | null; // The current error message, or null if no error

  // --- Actions ---
  loadData: () => Promise<void>; // Resolve the current Firebase user to a family member
  setCurrentMemberId: (memberId: string | null) => void; // Manually set the current member ID
  updatePreferences: (updates: Partial<UserPreferences>) => void; // Update one or more preference fields
}

/**
 * Default preference values used when the user has not customized any settings.
 * These are applied on initial load and when resetting preferences.
 */
const defaultPreferences: UserPreferences = {
  notificationsEnabled: true, // Notifications are enabled by default
};

/**
 * The Zustand user store. Created with `create<UserState>` which provides
 * a `set` function to update state. Components use this store via the
 * `useUserStore` hook (e.g., `const { currentMemberId } = useUserStore()`).
 */
export const useUserStore = create<UserState>((set) => ({
  // --- Initial State ---
  currentMemberId: null, // Not resolved until loadData() runs
  preferences: defaultPreferences, // Start with default preferences
  isLoading: false, // Not loading initially
  error: null, // No error initially

  /**
   * Resolves the currently authenticated Firebase user to a family member ID.
   *
   * The resolution process:
   * 1. Get the Firebase UID from the auth store
   * 2. Search the family members for one whose `userId` field matches the UID
   * 3. If a match is found, use that member's ID as currentMemberId
   * 4. If no match is found AND we are in development mode (__DEV__),
   *    fall back to 'eli' as a default for testing
   *
   * This method should be called after both the auth store and family store
   * have loaded their data.
   */
  loadData: async () => {
    set({ isLoading: true, error: null }); // Show loading state; clear any previous error
    try {
      // Step 1: Get the Firebase user's UID from the auth store (cross-store read)
      const uid = useAuthStore.getState().firebaseUser?.uid;
      // Step 2: Get all loaded family members from the family store (cross-store read)
      const members = useFamilyStore.getState().members;

      let memberId: string | null = null; // Will hold the resolved member ID
      if (uid) {
        // Step 3: Find a family member whose userId matches the Firebase UID
        const match = members.find((m) => m.userId === uid);
        if (match) memberId = match.id; // Found a match — use their family member ID
      }

      // Step 4: In development mode, fall back to a hardcoded ID for testing
      if (!memberId && __DEV__) {
        memberId = 'eli'; // Default dev member ID so the app works without real auth
      }

      // Update state with the resolved member ID and default preferences
      set({
        currentMemberId: memberId,
        preferences: defaultPreferences, // Reset to defaults on each load (will load from Firestore later)
        isLoading: false, // Done loading
      });
    } catch (error) {
      // Resolution failed — store the error message for the UI to display
      set({
        error: error instanceof Error ? error.message : 'Failed to load user data',
        isLoading: false,
      });
    }
  },

  /**
   * Manually sets the current member ID.
   * Useful for admin features, impersonation during testing, or when the
   * user switches which family member they are viewing as.
   *
   * @param memberId - The family member ID to set as current, or null to clear
   */
  setCurrentMemberId: (memberId: string | null) => {
    set({ currentMemberId: memberId });
  },

  /**
   * Updates one or more user preference fields.
   * Uses the spread operator to merge the updates into the existing preferences,
   * leaving unchanged fields intact.
   *
   * @param updates - An object containing the preference fields to update
   */
  updatePreferences: (updates: Partial<UserPreferences>) => {
    set((state) => ({
      preferences: { ...state.preferences, ...updates }, // Merge new values into existing preferences
    }));
  },
}));
