/**
 * Feed Item and Comment Type Definitions
 *
 * This file defines the data models for the Family Updates Feed in The Vine app.
 * The feed is the main social screen where family members share photos, memories,
 * milestones, and responses to story prompts. Each feed item can receive "heart"
 * reactions and comments from other family members.
 *
 * Story prompts are thoughtful questions designed to inspire memory sharing
 * (e.g., "What was the best advice your parents gave you?"). They are organized
 * into categories like childhood, family traditions, life lessons, etc.
 */

/**
 * Comment - A single comment on a feed item.
 * Comments are displayed in chronological order below each feed post.
 */
export interface Comment {
  id: string; // Unique identifier for this comment
  authorId: string; // The ID of the family member who wrote this comment
  authorName: string; // The display name of the comment author (denormalized for fast rendering)
  authorPhotoURL?: string; // Optional URL to the comment author's profile photo
  text: string; // The text content of the comment
  createdAt: Date; // Timestamp when the comment was posted
}

/**
 * FeedItem - A single post in the family updates feed.
 * This is the main content unit in the feed screen. Each item has a type
 * (photo, memory, milestone, or prompt response), content, and engagement data
 * (hearts and comments). Author info is denormalized (stored directly on the item)
 * so the feed can render quickly without extra lookups.
 */
export interface FeedItem {
  id: string; // Unique identifier for this feed item
  type: FeedItemType; // What kind of post this is (photo, memory, milestone, or prompt_response)
  authorId: string; // The ID of the family member who created this post
  authorName: string; // The display name of the post author (denormalized for fast rendering)
  authorPhotoURL?: string; // Optional URL to the post author's profile photo
  content: FeedContent; // The actual content of the post (text, media, prompt info)
  hearts: string[]; // Array of user IDs who have "hearted" (liked) this post
  comments: Comment[]; // Array of comments on this post, in chronological order
  createdAt: Date; // Timestamp when this post was first created
  updatedAt: Date; // Timestamp when this post was last modified
}

/**
 * FeedItemType - The different kinds of posts a family member can create.
 * 'photo' = a post with one or more photos
 * 'memory' = a text-based memory or story from the past
 * 'milestone' = a life event (anniversary, graduation, birth, etc.)
 * 'prompt_response' = an answer to a story prompt question
 */
export type FeedItemType = 'photo' | 'memory' | 'milestone' | 'prompt_response';

/**
 * FeedContent - The body/payload of a feed item.
 * Different FeedItemTypes use different combinations of these fields:
 * - A 'photo' post uses text + mediaURLs
 * - A 'memory' post uses text only
 * - A 'milestone' post uses text + optional mediaURLs
 * - A 'prompt_response' uses text + promptId + promptText
 */
export interface FeedContent {
  text?: string; // Optional text content of the post
  mediaURLs?: string[]; // Optional array of URLs to attached photos or media
  promptId?: string; // If this is a prompt response, the ID of the prompt that was answered
  promptText?: string; // If this is a prompt response, the text of the prompt question (denormalized)
}

/**
 * Prompt - A story prompt that encourages family members to share memories.
 * Prompts are displayed as cards in the feed to inspire posts.
 * Example: "What was the best advice your parents gave you?"
 */
export interface Prompt {
  id: string; // Unique identifier for this prompt
  text: string; // The prompt question text shown to users
  category: PromptCategory; // Which category this prompt belongs to (for filtering/organization)
  isActive: boolean; // Whether this prompt is currently shown to users (allows disabling prompts)
}

/**
 * PromptCategory - Categories for organizing story prompts.
 * Each category groups related questions together so the app can
 * show a variety of prompts across different topics.
 * 'childhood' = questions about growing up
 * 'family_traditions' = questions about recurring family events and customs
 * 'life_lessons' = questions about wisdom and advice
 * 'relationships' = questions about family bonds and connections
 * 'milestones' = questions about major life events
 * 'daily_life' = questions about everyday moments and routines
 */
export type PromptCategory =
  | 'childhood'
  | 'family_traditions'
  | 'life_lessons'
  | 'relationships'
  | 'milestones'
  | 'daily_life';
