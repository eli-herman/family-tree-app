/**
 * dailyVerses.ts - Daily Bible Verse Data and Selection Logic
 *
 * This file is part of The Vine family app's Daily Bible Verse feature.
 * It contains two things:
 *   1. A curated array of Bible verses about family, love, unity, and faith
 *   2. Two functions for selecting which verse to display
 *
 * The verses are hand-picked to align with the app's Christian family theme.
 * Each verse is tagged with a "theme" (like 'family', 'love', 'unity', etc.)
 * so the app can show relevant verses in different contexts.
 *
 * How verse selection works:
 *   - getDailyVerse(): Picks one verse per day using the day-of-year as an index.
 *     This means every user sees the same verse on the same day, and the verse
 *     changes automatically at midnight. It cycles through all 14 verses and
 *     then starts over.
 *   - getVerseByTheme(): Picks a random verse matching a given theme. Useful for
 *     showing contextually relevant verses (e.g., a "marriage" verse on an
 *     anniversary post).
 */

// Import the BibleVerse TypeScript interface that defines the shape of each verse object.
// The interface includes: id (string), reference (string), text (string), and theme (VerseTheme).
import { BibleVerse } from '../types/verse';

/**
 * familyVerses - The complete collection of Bible verses used throughout the app.
 *
 * This array contains 14 verses, each with:
 *   - id: A unique string identifier (e.g., '1', '2', '3')
 *   - reference: The Bible book, chapter, and verse (e.g., 'John 15:5')
 *   - text: The full verse text as a string
 *   - theme: A category tag from the VerseTheme type ('family', 'love', 'unity',
 *            'parenting', 'marriage', 'children', 'faith', or 'gratitude')
 *
 * The array is exported so other parts of the app can access the full list if needed.
 * getDailyVerse() cycles through this array one verse per day.
 */
export const familyVerses: BibleVerse[] = [
  // Verse 1: The app's signature verse - "I am the vine; you are the branches."
  // This is also referenced in the app's tagline and overall theme.
  {
    id: '1',
    reference: 'John 15:5',
    text: 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.',
    theme: 'faith',
  },
  // Verse 2: A verse about raising children with good values.
  {
    id: '2',
    reference: 'Proverbs 22:6',
    text: 'Start children off on the way they should go, and even when they are old they will not turn from it.',
    theme: 'parenting',
  },
  // Verse 3: The famous "love is patient, love is kind" passage.
  // One of the longer verses in the collection.
  {
    id: '3',
    reference: '1 Corinthians 13:4-7',
    text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.',
    theme: 'love',
  },
  // Verse 4: About love binding everything together in unity.
  {
    id: '4',
    reference: 'Colossians 3:14',
    text: 'And over all these virtues put on love, which binds them all together in perfect unity.',
    theme: 'unity',
  },
  // Verse 5: About children being a gift from God.
  {
    id: '5',
    reference: 'Psalm 127:3',
    text: 'Children are a heritage from the Lord, offspring a reward from him.',
    theme: 'children',
  },
  // Verse 6: About humility, patience, and keeping peace within a family.
  {
    id: '6',
    reference: 'Ephesians 4:2-3',
    text: 'Be completely humble and gentle; be patient, bearing with one another in love. Make every effort to keep the unity of the Spirit through the bond of peace.',
    theme: 'unity',
  },
  // Verse 7: A declaration of family faith - "as for me and my household."
  // A popular verse for Christian families.
  {
    id: '7',
    reference: 'Joshua 24:15',
    text: 'But as for me and my household, we will serve the Lord.',
    theme: 'family',
  },
  // Verse 8: About the pride between grandparents, parents, and children.
  {
    id: '8',
    reference: 'Proverbs 17:6',
    text: "Children's children are a crown to the aged, and parents are the pride of their children.",
    theme: 'family',
  },
  // Verse 9: A short, powerful verse about the source of love.
  {
    id: '9',
    reference: '1 John 4:19',
    text: 'We love because he first loved us.',
    theme: 'love',
  },
  // Verse 10: About passing faith and teachings to the next generation.
  {
    id: '10',
    reference: 'Deuteronomy 6:6-7',
    text: 'These commandments that I give you today are to be on your hearts. Impress them on your children. Talk about them when you sit at home and when you walk along the road.',
    theme: 'parenting',
  },
  // Verse 11: About the strength found in partnership - relevant to marriage.
  {
    id: '11',
    reference: 'Ecclesiastes 4:9-10',
    text: 'Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up.',
    theme: 'marriage',
  },
  // Verse 12: About the beauty of living together in harmony.
  {
    id: '12',
    reference: 'Psalm 133:1',
    text: "How good and pleasant it is when God's people live together in unity!",
    theme: 'unity',
  },
  // Verse 13: About being thankful in all situations.
  {
    id: '13',
    reference: '1 Thessalonians 5:18',
    text: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    theme: 'gratitude',
  },
  // Verse 14: About a family honoring and praising a loving mother.
  {
    id: '14',
    reference: 'Proverbs 31:28',
    text: 'Her children arise and call her blessed; her husband also, and he praises her.',
    theme: 'family',
  },
];

/**
 * getDailyVerse - Returns a single Bible verse that changes once per day.
 *
 * How it works:
 *   1. Gets today's date
 *   2. Calculates the "day of the year" (a number from 1 to 365/366)
 *   3. Uses the modulo operator (%) to pick a verse from the array
 *
 * Because it uses the day of the year, every user of the app sees the same
 * verse on any given day. The verse automatically changes at midnight.
 * After cycling through all 14 verses (about 2 weeks), it starts over.
 *
 * Example: On January 15 (day 15 of the year), the index would be 15 % 14 = 1,
 * so it would return the verse at index 1 (Proverbs 22:6).
 *
 * @returns {BibleVerse} The Bible verse object for today
 */
export function getDailyVerse(): BibleVerse {
  // Use the day of the year to cycle through verses
  // Create a Date object representing the current date and time
  const now = new Date();

  // Create a Date object for December 31 of the previous year (month 0 = January, day 0 = last day of previous month).
  // This serves as the baseline to measure how many days have passed this year.
  const start = new Date(now.getFullYear(), 0, 0);

  // Calculate the difference in milliseconds between now and the start of the year.
  // getTime() converts each Date to milliseconds since January 1, 1970 (the Unix epoch).
  const diff = now.getTime() - start.getTime();

  // Convert the millisecond difference into whole days.
  // 1000 milliseconds * 60 seconds * 60 minutes * 24 hours = 86,400,000 ms per day.
  // Math.floor() rounds down to get a whole number (e.g., 15.7 becomes 15).
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Use the modulo operator (%) to wrap the day number around the array length.
  // This ensures the index is always between 0 and familyVerses.length - 1 (0 to 13).
  // For example: day 15 % 14 = 1, day 28 % 14 = 0, day 29 % 14 = 1, etc.
  const index = dayOfYear % familyVerses.length;

  // Return the verse at the calculated index position in the array
  return familyVerses[index];
}

/**
 * getVerseByTheme - Returns a random Bible verse that matches a specific theme.
 *
 * This function is useful when the app wants to show a contextually relevant verse.
 * For example, showing a "marriage" verse on an anniversary post, or a "children"
 * verse when a new baby is added to the family tree.
 *
 * How it works:
 *   1. Filters the familyVerses array to only include verses with the given theme
 *   2. Picks a random verse from the filtered results
 *   3. If no verses match the theme, falls back to the very first verse in the array
 *
 * @param {BibleVerse['theme']} theme - The theme to filter by (e.g., 'love', 'family', 'unity').
 *        Using BibleVerse['theme'] as the type means it automatically stays in sync
 *        with the VerseTheme type defined in the BibleVerse interface.
 * @returns {BibleVerse} A random Bible verse matching the theme, or the first verse as a fallback
 */
export function getVerseByTheme(theme: BibleVerse['theme']): BibleVerse {
  // Filter the full verse array to only keep verses whose theme property matches the requested theme.
  // Array.filter() creates a new array containing only elements where the callback returns true.
  // For example, if theme is 'love', this keeps only verses with theme: 'love'.
  const themeVerses = familyVerses.filter((v) => v.theme === theme);

  // Generate a random index within the range of the filtered array.
  // Math.random() returns a decimal between 0 (inclusive) and 1 (exclusive).
  // Multiplying by the array length and using Math.floor() gives a whole number
  // from 0 to themeVerses.length - 1. For example, if there are 3 matching verses,
  // this gives 0, 1, or 2.
  const randomIndex = Math.floor(Math.random() * themeVerses.length);

  // Return the randomly selected verse from the filtered list.
  // The "|| familyVerses[0]" is a safety fallback: if themeVerses is empty
  // (meaning no verses matched the requested theme), themeVerses[randomIndex]
  // would be undefined, so it falls back to the first verse in the full array.
  // The || (logical OR) operator returns the right side if the left side is falsy (undefined).
  return themeVerses[randomIndex] || familyVerses[0];
}
