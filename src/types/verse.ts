/**
 * Bible Verse Type Definitions
 *
 * This file defines the data model for the Daily Bible Verse feature in The Vine app.
 * Each day, the app displays a curated verse about family, love, unity, or faith.
 * Verses are tagged with a theme so the app can also look up verses by topic
 * (e.g., showing a "marriage" verse on an anniversary post).
 */

/**
 * BibleVerse - Represents a single Bible verse used in the app.
 * The app ships with a built-in collection of family-themed verses
 * defined in src/utils/dailyVerses.ts.
 */
export interface BibleVerse {
  id: string; // Unique identifier for this verse (e.g., "1", "2", etc.)
  reference: string; // The Bible book, chapter, and verse reference (e.g., "John 15:5")
  text: string; // The full text of the Bible verse
  theme: VerseTheme; // The thematic category this verse belongs to
}

/**
 * VerseTheme - Categories for organizing Bible verses by topic.
 * These themes correspond to key aspects of family life and faith:
 * 'family' = verses about family bonds and togetherness
 * 'love' = verses about love between people
 * 'unity' = verses about coming together and working as one
 * 'parenting' = verses about raising children and parental guidance
 * 'marriage' = verses about marriage and partnership
 * 'children' = verses about children and young people
 * 'faith' = verses about trust in God and spiritual growth
 * 'gratitude' = verses about thankfulness and appreciation
 */
export type VerseTheme =
  | 'family'
  | 'love'
  | 'unity'
  | 'parenting'
  | 'marriage'
  | 'children'
  | 'faith'
  | 'gratitude';
