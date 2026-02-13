/**
 * feedStore.ts - Feed Store
 *
 * This Zustand store manages the family updates feed for The Vine app.
 * The feed is the main content stream where family members share photos,
 * memories, milestones, and other updates.
 *
 * It handles:
 *   - Loading feed items (currently from mock data, will connect to Firestore)
 *   - Adding, updating, and removing individual feed items
 *   - Toggling heart reactions on feed items (like/unlike)
 *   - Querying feed items by author or by ID
 *   - Retrieving comments on a specific feed item
 *
 * Each feed item (FeedItem) contains content, author info, timestamps,
 * a list of user IDs who have hearted it, and associated comments.
 */

import { create } from 'zustand'; // Zustand is a lightweight state management library for React
import { FeedItem, Comment } from '../types'; // FeedItem = a post in the feed; Comment = a comment on a post
import { mockFeedItems } from '../utils/mockData'; // Placeholder data used during development before Firestore is connected

/**
 * TypeScript interface defining the shape of the feed store's state and actions.
 * This tells TypeScript (and developers) exactly what properties and methods
 * are available on the store.
 */
interface FeedState {
  items: FeedItem[]; // The array of all feed items (posts) currently loaded
  isLoading: boolean; // Whether feed data is currently being fetched
  error: string | null; // The current error message, or null if no error

  // --- Mutation Actions ---
  setItems: (items: FeedItem[]) => void; // Replace all feed items at once
  addItem: (item: FeedItem) => void; // Add a single new item to the top of the feed
  updateItem: (id: string, updates: Partial<FeedItem>) => void; // Update specific fields on an existing item
  removeItem: (id: string) => void; // Remove an item from the feed by its ID
  setLoading: (loading: boolean) => void; // Manually control the loading state
  toggleHeart: (itemId: string, userId: string) => void; // Add or remove a heart reaction

  // --- Async Loading ---
  loadData: () => Promise<void>; // Fetch feed data (mock for now, Firestore later)

  // --- Selectors (read-only queries) ---
  getItemsByAuthor: (memberId: string) => FeedItem[]; // Get all posts by a specific family member
  getComments: (itemId: string) => Comment[]; // Get all comments on a specific post
  getItemById: (itemId: string) => FeedItem | undefined; // Find a single post by its ID
}

/**
 * The Zustand feed store. Created with `create<FeedState>` which provides
 * `set` to update state and `get` to read current state within actions.
 * Components use this store via the `useFeedStore` hook.
 */
export const useFeedStore = create<FeedState>((set, get) => ({
  // --- Initial State ---
  items: [], // Start with an empty feed; items are loaded via loadData()
  isLoading: false, // Not loading initially
  error: null, // No error initially

  /**
   * Replaces the entire feed items array with a new array.
   * Useful when receiving a fresh set of items from the server.
   *
   * @param items - The new array of feed items to set
   */
  setItems: (items) => set({ items }),

  /**
   * Adds a new feed item to the beginning of the items array.
   * New posts appear at the top of the feed (most recent first).
   *
   * @param item - The new FeedItem to add
   */
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),

  /**
   * Updates specific fields on an existing feed item.
   * Uses the spread operator to merge updates into the existing item,
   * leaving unchanged fields intact.
   *
   * @param id - The ID of the feed item to update
   * @param updates - An object containing the fields to update (partial FeedItem)
   */
  updateItem: (id, updates) =>
    set((state) => ({
      // Map over all items; for the matching item, merge in the updates
      items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),

  /**
   * Removes a feed item from the store by its ID.
   * Filters out the item with the matching ID, keeping all others.
   *
   * @param id - The ID of the feed item to remove
   */
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id), // Keep only items that do NOT match the ID
    })),

  /**
   * Manually sets the loading state.
   * Useful for external components that need to control the loading indicator
   * (e.g., pull-to-refresh).
   *
   * @param isLoading - Whether the feed is currently loading
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Toggles a heart reaction on a feed item for a specific user.
   * If the user has already hearted the item, their heart is removed (unlike).
   * If the user has not hearted the item, their heart is added (like).
   * The `hearts` array on each FeedItem stores the user IDs of everyone who hearted it.
   *
   * @param itemId - The ID of the feed item to toggle the heart on
   * @param userId - The ID of the user toggling their heart
   */
  toggleHeart: (itemId, userId) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item; // Skip items that don't match
        // Check if the user has already hearted this item
        const hearts = item.hearts.includes(userId)
          ? item.hearts.filter((id) => id !== userId) // Remove their heart (unlike)
          : [...item.hearts, userId]; // Add their heart (like)
        return { ...item, hearts }; // Return the item with the updated hearts array
      }),
    })),

  /**
   * Loads feed data asynchronously.
   * Currently uses mock data with a simulated 100ms delay to mimic a network request.
   * In the future, this will fetch from Firestore.
   */
  loadData: async () => {
    set({ isLoading: true, error: null }); // Show loading state; clear any previous error
    try {
      // Simulate async loading with 100ms delay (will be replaced with Firestore query)
      await new Promise((resolve) => setTimeout(resolve, 100));
      set({ items: mockFeedItems, isLoading: false }); // Load the mock data into state
    } catch (error) {
      // Loading failed — store the error message for the UI to display
      set({
        error: error instanceof Error ? error.message : 'Failed to load feed data',
        isLoading: false,
      });
    }
  },

  /**
   * Returns all feed items authored by a specific family member.
   * Useful for displaying a member's posts on their profile page.
   *
   * @param memberId - The family member ID to filter posts by
   * @returns An array of FeedItems where authorId matches the given memberId
   */
  getItemsByAuthor: (memberId) => get().items.filter((item) => item.authorId === memberId),

  /**
   * Returns all comments for a specific feed item.
   * Falls back to an empty array if the item is not found or has no comments.
   *
   * @param itemId - The ID of the feed item to get comments for
   * @returns An array of Comment objects, or an empty array
   */
  getComments: (itemId) => {
    const item = get().items.find((i) => i.id === itemId); // Look up the feed item by ID
    return item?.comments || []; // Return its comments, or empty array if item not found
  },

  /**
   * Finds and returns a single feed item by its ID.
   * Returns undefined if no item with that ID exists in the store.
   *
   * @param itemId - The ID of the feed item to find
   * @returns The matching FeedItem, or undefined if not found
   */
  getItemById: (itemId) => get().items.find((i) => i.id === itemId),
}));
