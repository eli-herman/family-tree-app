export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  text: string;
  createdAt: Date;
}

export interface FeedItem {
  id: string;
  type: FeedItemType;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: FeedContent;
  hearts: string[]; // User IDs who hearted
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export type FeedItemType = 'photo' | 'memory' | 'milestone' | 'prompt_response';

export interface FeedContent {
  text?: string;
  mediaURLs?: string[];
  promptId?: string;
  promptText?: string;
}

export interface Prompt {
  id: string;
  text: string;
  category: PromptCategory;
  isActive: boolean;
}

export type PromptCategory =
  | 'childhood'
  | 'family_traditions'
  | 'life_lessons'
  | 'relationships'
  | 'milestones'
  | 'daily_life';
