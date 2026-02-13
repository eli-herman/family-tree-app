/**
 * mockData.ts - Mock Family Member Data and Feed Items for Development
 *
 * This file provides fake (mock) data that the app uses during development
 * before a real Firebase backend is connected. It contains three exports:
 *
 *   1. mockFamilyMembers - An array of 12 FamilyMember objects representing
 *      the Herman family across 3 generations (grandparents, parents, children).
 *      Each member has relationships linking them to other members by ID.
 *
 *   2. mockFeedItems - An array of 8 FeedItem objects simulating posts in the
 *      family updates feed. Includes different post types: memories, photos,
 *      milestones, and prompt responses. Each has realistic comments and hearts.
 *
 *   3. mockPrompts - An array of 3 Prompt objects representing story prompts
 *      that encourage family members to share memories.
 *
 * The family structure looks like this:
 *
 *   Generation 1 (Grandparents):
 *     - Peggy & Ron Deleenheer (maternal grandparents)
 *     - James & Linda Herman (paternal grandparents)
 *
 *   Generation 2 (Parents):
 *     - Shelby Herman (daughter of Peggy & Ron) married to
 *     - Timothy Herman (son of James & Linda)
 *
 *   Generation 3 (Children + In-law):
 *     - Ella Fu (married to Preston Fu, they have daughter Mila)
 *     - Eli Herman (the app developer)
 *     - Bennett Herman
 *     - Ember Herman
 *
 * Once Firebase is connected, this file will no longer be needed and can be
 * removed or kept for testing purposes only.
 */

// Import the TypeScript interfaces that define the shape of feed items and family members.
// FeedItem defines the structure for posts in the feed (type, content, hearts, comments, etc.).
// FamilyMember defines the structure for people in the family tree (name, bio, relationships, etc.).
import { FeedItem, FamilyMember } from '../types';

// Herman Family Mock Data
// 9 members across 3 generations
// Relationships stored: parent/child, spouse (siblings derived at runtime from shared parents)

/**
 * mockFamilyMembers - Array of all family members in the mock Herman family.
 *
 * Each FamilyMember object contains:
 *   - id: A short string used to reference this member (e.g., 'peggy', 'eli')
 *   - firstName / lastName: The member's name
 *   - nickname: An informal name like 'Grandma' or 'Dad' (optional)
 *   - gender: 'male' or 'female' - used for gendered relationship labels
 *   - photoURL: A link to a placeholder avatar image from pravatar.cc
 *   - birthDate: A JavaScript Date object for when they were born
 *   - bio: A short description of the person
 *   - relationships: An array of links to other members, each with a memberId and type
 *     (e.g., { memberId: 'ron', type: 'spouse' } means this person is married to Ron)
 *   - createdBy: The ID of who added this member (all set to 'eli' since he's the developer)
 *   - createdAt / updatedAt: Timestamps for when the record was created/modified
 *
 * Note: Sibling relationships are NOT stored here. The app figures out who is a sibling
 * at runtime by finding members who share the same parents.
 */
export const mockFamilyMembers: FamilyMember[] = [
  // ============================================================
  // GENERATION 1: GRANDPARENTS
  // These are the oldest generation in the family tree.
  // Two couples: Peggy & Ron (maternal), James & Linda (paternal).
  // ============================================================

  // Generation 1 (Grandparents)
  // Peggy Deleenheer - Maternal grandmother. Married to Ron.
  // She is the mother of Shelby (Generation 2).
  {
    id: 'peggy', // Unique identifier used to reference Peggy throughout the app
    firstName: 'Peggy', // First name displayed in the UI
    lastName: 'Deleenheer', // Last name (maiden name, kept after marriage in this data)
    nickname: 'Grandma', // Informal name shown on the family tree and profile
    gender: 'female', // Used for gendered labels like "Grandmother" instead of "Grandparent"
    photoURL: 'https://i.pravatar.cc/150?u=peggy', // Placeholder avatar image URL; the ?u=peggy query param generates a unique avatar
    birthDate: new Date('1948-05-12'), // JavaScript Date object: May 12, 1948
    bio: 'Loves gardening, baking, and spending time with grandchildren. Always has a warm cookie ready.', // Short description shown on profile
    relationships: [
      { memberId: 'ron', type: 'spouse' }, // Peggy is married to Ron
      { memberId: 'shelby', type: 'child' }, // Peggy is the mother of Shelby
    ],
    createdBy: 'eli', // Eli (the developer) added this member to the tree
    createdAt: new Date('2024-01-01'), // Record creation timestamp
    updatedAt: new Date('2024-01-01'), // Record last-modified timestamp
  },

  // Ron Deleenheer - Maternal grandfather. Married to Peggy.
  // He is the father of Shelby (Generation 2).
  {
    id: 'ron', // Unique identifier for Ron
    firstName: 'Ron',
    lastName: 'Deleenheer',
    nickname: 'Grandpa', // Informal name
    gender: 'male',
    photoURL: 'https://i.pravatar.cc/150?u=ron', // Unique placeholder avatar for Ron
    birthDate: new Date('1946-08-23'), // August 23, 1946
    bio: 'Retired engineer who still loves tinkering in the garage. Teaches the grandkids about cars.',
    relationships: [
      { memberId: 'peggy', type: 'spouse' }, // Ron is married to Peggy
      { memberId: 'shelby', type: 'child' }, // Ron is the father of Shelby
    ],
    createdBy: 'eli',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Generation 1 (Paternal Grandparents)
  // James Herman - Paternal grandfather. Married to Linda.
  // He is the father of Timothy (Generation 2).
  {
    id: 'james', // Unique identifier for James
    firstName: 'James',
    lastName: 'Herman',
    nickname: 'Papa', // Informal name used by grandchildren
    gender: 'male',
    photoURL: 'https://i.pravatar.cc/150?u=james', // Unique placeholder avatar for James
    birthDate: new Date('1944-02-19'), // February 19, 1944
    bio: 'A man of faith and hard work. Spent 40 years as a carpenter and never missed a Sunday service.',
    relationships: [
      { memberId: 'linda', type: 'spouse' }, // James is married to Linda
      { memberId: 'timothy', type: 'child' }, // James is the father of Timothy
    ],
    createdBy: 'eli',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Linda Herman - Paternal grandmother. Married to James.
  // She is the mother of Timothy (Generation 2).
  {
    id: 'linda', // Unique identifier for Linda
    firstName: 'Linda',
    lastName: 'Herman',
    nickname: 'Nana', // Informal name used by grandchildren
    gender: 'female',
    photoURL: 'https://i.pravatar.cc/150?u=linda', // Unique placeholder avatar for Linda
    birthDate: new Date('1947-09-30'), // September 30, 1947
    bio: 'Retired schoolteacher who still tutors neighborhood kids. Famous for her Sunday pot roast.',
    relationships: [
      { memberId: 'james', type: 'spouse' }, // Linda is married to James
      { memberId: 'timothy', type: 'child' }, // Linda is the mother of Timothy
    ],
    createdBy: 'eli',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // ============================================================
  // GENERATION 2: PARENTS
  // Shelby (daughter of Peggy & Ron) married Timothy (son of James & Linda).
  // Together they have four children: Ella, Eli, Bennett, and Ember.
  // ============================================================

  // Generation 2 (Parents)
  // Shelby Herman - Mother. Daughter of Peggy and Ron Deleenheer.
  // Married to Timothy Herman. Has four children.
  {
    id: 'shelby', // Unique identifier for Shelby
    firstName: 'Shelby',
    lastName: 'Herman', // Took her husband's last name
    nickname: 'Mom', // Informal name used by her children
    gender: 'female',
    photoURL: 'https://i.pravatar.cc/150?u=shelby', // Unique placeholder avatar for Shelby
    birthDate: new Date('1972-03-15'), // March 15, 1972
    bio: 'Heart of the family. Loves hosting dinners and keeping everyone connected.',
    relationships: [
      { memberId: 'peggy', type: 'parent' }, // Shelby's mother is Peggy
      { memberId: 'ron', type: 'parent' }, // Shelby's father is Ron
      { memberId: 'timothy', type: 'spouse' }, // Shelby is married to Timothy
      { memberId: 'ella', type: 'child' }, // Shelby is the mother of Ella
      { memberId: 'eli', type: 'child' }, // Shelby is the mother of Eli
      { memberId: 'bennett', type: 'child' }, // Shelby is the mother of Bennett
      { memberId: 'ember', type: 'child' }, // Shelby is the mother of Ember
    ],
    createdBy: 'eli',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Timothy Herman - Father. Son of James and Linda Herman.
  // Married to Shelby. Has four children.
  {
    id: 'timothy', // Unique identifier for Timothy
    firstName: 'Timothy',
    lastName: 'Herman',
    nickname: 'Dad', // Informal name used by his children
    gender: 'male',
    photoURL: 'https://i.pravatar.cc/150?u=timothy', // Unique placeholder avatar for Timothy
    birthDate: new Date('1970-11-08'), // November 8, 1970
    bio: 'Works hard, loves harder. Enjoys camping trips and teaching life lessons.',
    relationships: [
      { memberId: 'james', type: 'parent' }, // Timothy's father is James
      { memberId: 'linda', type: 'parent' }, // Timothy's mother is Linda
      { memberId: 'shelby', type: 'spouse' }, // Timothy is married to Shelby
      { memberId: 'ella', type: 'child' }, // Timothy is the father of Ella
      { memberId: 'eli', type: 'child' }, // Timothy is the father of Eli
      { memberId: 'bennett', type: 'child' }, // Timothy is the father of Bennett
      { memberId: 'ember', type: 'child' }, // Timothy is the father of Ember
    ],
    createdBy: 'eli',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // ============================================================
  // GENERATION 3: CHILDREN + SPOUSES + GRANDCHILDREN
  // The youngest generation: Ella (married to Preston, with daughter Mila),
  // Eli, Bennett, and Ember.
  // ============================================================

  // Generation 3 (Siblings + In-law)
  // Ella Fu - Oldest child of Shelby and Timothy. Married to Preston.
  // She is the mother of Mila (the newest generation).
  {
    id: 'ella', // Unique identifier for Ella
    firstName: 'Ella',
    lastName: 'Fu', // Took her husband Preston's last name
    gender: 'female',
    photoURL: 'https://i.pravatar.cc/150?u=ella', // Unique placeholder avatar for Ella
    birthDate: new Date('1996-07-22'), // July 22, 1996
    bio: 'Oldest sibling. Creative soul who loves art and photography. Recently married to Preston.',
    relationships: [
      { memberId: 'shelby', type: 'parent' }, // Ella's mother is Shelby
      { memberId: 'timothy', type: 'parent' }, // Ella's father is Timothy
      { memberId: 'preston', type: 'spouse' }, // Ella is married to Preston
      { memberId: 'mila', type: 'child' }, // Ella is the mother of Mila
    ],
    createdBy: 'eli',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Preston Fu - Ella's husband. An in-law who married into the Herman family.
  // He is the father of Mila.
  {
    id: 'preston', // Unique identifier for Preston
    firstName: 'Preston',
    lastName: 'Fu',
    gender: 'male',
    photoURL: 'https://i.pravatar.cc/150?u=preston', // Unique placeholder avatar for Preston
    birthDate: new Date('1995-02-14'), // February 14, 1995 (Valentine's Day!)
    bio: "Ella's husband. Software engineer and board game enthusiast. Welcomed into the family with open arms.",
    relationships: [
      { memberId: 'ella', type: 'spouse' }, // Preston is married to Ella
      { memberId: 'mila', type: 'child' }, // Preston is the father of Mila
    ],
    createdBy: 'eli',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Mila Fu - Daughter of Ella and Preston. The newest and youngest family member.
  // She represents a potential 4th generation in the tree.
  {
    id: 'mila', // Unique identifier for Mila
    firstName: 'Mila',
    lastName: 'Fu',
    gender: 'female',
    photoURL: 'https://i.pravatar.cc/150?u=mila', // Unique placeholder avatar for Mila
    birthDate: new Date('2024-05-18'), // May 18, 2024 - a baby!
    bio: "Ella and Preston's daughter. Curious, bright, and already loves music.",
    relationships: [
      { memberId: 'ella', type: 'parent' }, // Mila's mother is Ella
      { memberId: 'preston', type: 'parent' }, // Mila's father is Preston
    ],
    createdBy: 'ella', // Ella added Mila to the tree (not Eli, since Ella is the parent)
    createdAt: new Date('2024-05-18'), // Created on Mila's birth date
    updatedAt: new Date('2024-05-18'),
  },

  // Eli Herman - The developer of this app! Second child of Shelby and Timothy.
  // Currently unmarried with no children in the data.
  {
    id: 'eli', // Unique identifier for Eli
    firstName: 'Eli',
    lastName: 'Herman',
    gender: 'male',
    photoURL: 'https://i.pravatar.cc/150?u=eli', // Unique placeholder avatar for Eli
    birthDate: new Date('1998-09-03'), // September 3, 1998
    bio: 'The family tech guy. Building apps to bring people closer together.',
    relationships: [
      { memberId: 'shelby', type: 'parent' }, // Eli's mother is Shelby
      { memberId: 'timothy', type: 'parent' }, // Eli's father is Timothy
    ],
    createdBy: 'eli', // Eli created his own record
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Bennett Herman - Third child of Shelby and Timothy.
  // Currently unmarried with no children in the data.
  {
    id: 'bennett', // Unique identifier for Bennett
    firstName: 'Bennett',
    lastName: 'Herman',
    gender: 'male',
    photoURL: 'https://i.pravatar.cc/150?u=bennett', // Unique placeholder avatar for Bennett
    birthDate: new Date('2001-04-17'), // April 17, 2001
    bio: 'Younger brother. Sports fan and aspiring musician. Always up for an adventure.',
    relationships: [
      { memberId: 'shelby', type: 'parent' }, // Bennett's mother is Shelby
      { memberId: 'timothy', type: 'parent' }, // Bennett's father is Timothy
    ],
    createdBy: 'eli',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  // Ember Herman - Youngest child of Shelby and Timothy (the "baby of the family").
  // Currently unmarried with no children in the data.
  {
    id: 'ember', // Unique identifier for Ember
    firstName: 'Ember',
    lastName: 'Herman',
    gender: 'female',
    photoURL: 'https://i.pravatar.cc/150?u=ember', // Unique placeholder avatar for Ember
    birthDate: new Date('2004-12-25'), // December 25, 2004 (Christmas Day!)
    bio: 'Baby of the family. Loves animals and dreams of becoming a veterinarian.',
    relationships: [
      { memberId: 'shelby', type: 'parent' }, // Ember's mother is Shelby
      { memberId: 'timothy', type: 'parent' }, // Ember's father is Timothy
    ],
    createdBy: 'eli',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// ============================================================
// MOCK FEED ITEMS
// These simulate posts that family members have shared in the app's feed.
// Each item has a type, author info, content, hearts (likes), and comments.
// The items are ordered from newest (id '1') to oldest (id '8').
// ============================================================

/**
 * mockFeedItems - Array of simulated feed posts for the Family Updates Feed.
 *
 * Feed items use "denormalized" author data, meaning the author's name and photo
 * are stored directly on each post (instead of just an ID that requires a lookup).
 * This is a common pattern in social apps for fast rendering.
 *
 * Each FeedItem has:
 *   - id: Unique string identifier
 *   - type: 'memory' | 'photo' | 'milestone' | 'prompt_response'
 *   - authorId: The ID of the family member who created the post
 *   - authorName: Display name (denormalized - stored here for quick access)
 *   - authorPhotoURL: Avatar URL (denormalized)
 *   - content: Object with text and optional mediaURLs or prompt info
 *   - hearts: Array of member IDs who liked this post
 *   - comments: Array of comment objects with author info, text, and timestamp
 *   - createdAt / updatedAt: Timestamps
 */
// Feed items using Herman family member IDs
export const mockFeedItems: FeedItem[] = [
  // Feed Item 1: A memory post from Grandma Peggy about making apple pie.
  // Type 'memory' = a text-based recollection from the past (no photos).
  {
    id: '1', // Unique identifier for this feed item
    type: 'memory', // This is a text-based memory post (no photos attached)
    authorId: 'peggy', // Posted by Peggy (Grandma)
    authorName: 'Peggy Deleenheer', // Peggy's full display name
    authorPhotoURL: 'https://i.pravatar.cc/150?u=peggy', // Peggy's avatar image
    content: {
      text: 'Remember when we used to make apple pie together every fall? The kitchen would smell so wonderful. I miss those afternoons with all of you gathered around.', // The memory text
      mediaURLs: [], // Empty array - memory posts typically have no photos
    },
    hearts: ['eli', 'shelby', 'ella'], // Three family members hearted (liked) this post
    comments: [
      // Comment from Shelby (her daughter) reminiscing about the smell
      {
        id: 'comment-1-1', // Unique comment ID (format: comment-{feedItemId}-{commentNumber})
        authorId: 'shelby', // Comment author's member ID
        authorName: 'Shelby Herman', // Comment author's display name (denormalized)
        authorPhotoURL: 'https://i.pravatar.cc/150?u=shelby', // Comment author's avatar
        text: 'I still remember that cinnamon smell! We should make pies together this fall.', // Comment text
        createdAt: new Date('2026-01-28T11:00:00'), // When the comment was posted
      },
      // Comment from Eli (her grandson) praising the pies
      {
        id: 'comment-1-2',
        authorId: 'eli',
        authorName: 'Eli Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=eli',
        text: 'Best pies ever, Grandma!',
        createdAt: new Date('2026-01-28T12:30:00'), // Posted 1.5 hours after Shelby's comment
      },
    ],
    createdAt: new Date('2026-01-28T10:30:00'), // When the post was originally created
    updatedAt: new Date('2026-01-28T10:30:00'), // Same as createdAt since it hasn't been edited
  },

  // Feed Item 2: A photo post from Dad (Timothy) sharing an old camping trip photo.
  // Type 'photo' = a post that includes one or more images.
  {
    id: '2',
    type: 'photo', // This is a photo post - it includes an image URL
    authorId: 'timothy', // Posted by Timothy (Dad)
    authorName: 'Timothy Herman',
    authorPhotoURL: 'https://i.pravatar.cc/150?u=timothy',
    content: {
      text: 'Found this old photo from our 2015 camping trip! Look how little everyone was.', // Caption for the photo
      mediaURLs: ['https://picsum.photos/400/300?random=1'], // Array of photo URLs - picsum.photos provides random placeholder images
    },
    hearts: ['shelby', 'ella', 'eli', 'bennett', 'ember'], // Five hearts - the whole immediate family liked it
    comments: [
      // Comment from Bennett remembering how small he was
      {
        id: 'comment-2-1',
        authorId: 'bennett',
        authorName: 'Bennett Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=bennett',
        text: 'Haha I was so small! That was such a fun trip.',
        createdAt: new Date('2026-01-27T16:00:00'),
      },
      // Comment from Ember wanting to go camping again
      {
        id: 'comment-2-2',
        authorId: 'ember',
        authorName: 'Ember Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=ember',
        text: "I remember the s'mores! Can we go camping again soon?",
        createdAt: new Date('2026-01-27T17:15:00'),
      },
      // Comment from Grandma Peggy about how fast they grow up
      {
        id: 'comment-2-3',
        authorId: 'peggy',
        authorName: 'Peggy Deleenheer',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=peggy',
        text: 'Such precious memories. You all grow up so fast.',
        createdAt: new Date('2026-01-27T18:00:00'),
      },
    ],
    createdAt: new Date('2026-01-27T15:00:00'),
    updatedAt: new Date('2026-01-27T15:00:00'),
  },

  // Feed Item 3: A prompt response from Mom (Shelby) answering a story prompt.
  // Type 'prompt_response' = an answer to one of the app's story prompts.
  // This post includes the original prompt text so readers can see the question being answered.
  {
    id: '3',
    type: 'prompt_response', // This is a response to a story prompt question
    authorId: 'shelby', // Posted by Shelby (Mom)
    authorName: 'Shelby Herman',
    authorPhotoURL: 'https://i.pravatar.cc/150?u=shelby',
    content: {
      text: "The best advice my parents gave me was to always treat others the way you want to be treated. Simple but powerful. I've tried to pass this on to all of you.", // Shelby's answer to the prompt
      promptId: 'prompt1', // Links back to the prompt in the mockPrompts array
      promptText: 'What was the best advice your parents gave you?', // The original prompt question (denormalized for display)
    },
    hearts: ['peggy', 'ron', 'eli', 'bennett', 'ember'], // Five hearts from family members
    comments: [
      // Comment from Ron (Shelby's father) expressing pride
      {
        id: 'comment-3-1',
        authorId: 'ron',
        authorName: 'Ron Deleenheer',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=ron',
        text: "Your mother and I are so proud of the person you've become, Shelby.",
        createdAt: new Date('2026-01-26T10:00:00'),
      },
      // Comment from Eli thanking his mom
      {
        id: 'comment-3-2',
        authorId: 'eli',
        authorName: 'Eli Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=eli',
        text: 'This is definitely something I think about often. Thanks for teaching us, Mom.',
        createdAt: new Date('2026-01-26T11:30:00'),
      },
    ],
    createdAt: new Date('2026-01-26T09:15:00'),
    updatedAt: new Date('2026-01-26T09:15:00'),
  },

  // Feed Item 4: A milestone post from Ella celebrating her wedding anniversary.
  // Type 'milestone' = a post about a significant life event (anniversary, graduation, birth, etc.).
  {
    id: '4',
    type: 'milestone', // This is a milestone/life event post
    authorId: 'ella', // Posted by Ella
    authorName: 'Ella Fu',
    authorPhotoURL: 'https://i.pravatar.cc/150?u=ella',
    content: {
      text: 'Preston and I just celebrated our first wedding anniversary! Thank you all for your love and support.', // Milestone announcement text
      mediaURLs: ['https://picsum.photos/400/500?random=2'], // A photo from the celebration
    },
    hearts: ['peggy', 'ron', 'shelby', 'timothy', 'eli', 'bennett', 'ember'], // Seven hearts - almost everyone in the family!
    comments: [
      // Comment from Mom (Shelby) congratulating her daughter
      {
        id: 'comment-4-1',
        authorId: 'shelby',
        authorName: 'Shelby Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=shelby',
        text: 'Happy anniversary sweetie! So happy for you both!',
        createdAt: new Date('2026-01-25T19:00:00'),
      },
      // Comment from Dad (Timothy) wishing them many more years
      {
        id: 'comment-4-2',
        authorId: 'timothy',
        authorName: 'Timothy Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=timothy',
        text: "Congratulations! Here's to many more years together.",
        createdAt: new Date('2026-01-25T19:30:00'),
      },
      // Comment from Grandma Peggy noting how fast time passes
      {
        id: 'comment-4-3',
        authorId: 'peggy',
        authorName: 'Peggy Deleenheer',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=peggy',
        text: "A whole year already! Time flies when you're happy. Love you both.",
        createdAt: new Date('2026-01-25T20:00:00'),
      },
    ],
    createdAt: new Date('2026-01-25T18:45:00'),
    updatedAt: new Date('2026-01-25T18:45:00'),
  },

  // Feed Item 5: A photo post from Bennett about his band practice.
  // Type 'photo' with a music-themed update.
  {
    id: '5',
    type: 'photo', // Photo post with an image of band practice
    authorId: 'bennett', // Posted by Bennett
    authorName: 'Bennett Herman',
    authorPhotoURL: 'https://i.pravatar.cc/150?u=bennett',
    content: {
      text: 'Band practice going well! First gig next month.', // Caption text
      mediaURLs: ['https://picsum.photos/400/400?random=3'], // Placeholder photo of band practice
    },
    hearts: ['shelby', 'timothy', 'eli'], // Three hearts from parents and brother
    comments: [
      // Comment from Dad expressing pride
      {
        id: 'comment-5-1',
        authorId: 'timothy',
        authorName: 'Timothy Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=timothy',
        text: "Can't wait to see you perform! So proud of you.",
        createdAt: new Date('2026-01-24T21:00:00'),
      },
      // Comment from Ember wanting to attend
      {
        id: 'comment-5-2',
        authorId: 'ember',
        authorName: 'Ember Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=ember',
        text: 'You guys sound so good! I want front row seats!',
        createdAt: new Date('2026-01-24T21:30:00'),
      },
    ],
    createdAt: new Date('2026-01-24T20:00:00'),
    updatedAt: new Date('2026-01-24T20:00:00'),
  },

  // Feed Item 6: A memory post from Grandpa Ron about teaching Bennett to change a tire.
  // Type 'memory' = a text-only story about passing knowledge across generations.
  {
    id: '6',
    type: 'memory', // Text-only memory post (no photos)
    authorId: 'ron', // Posted by Ron (Grandpa)
    authorName: 'Ron Deleenheer',
    authorPhotoURL: 'https://i.pravatar.cc/150?u=ron',
    content: {
      text: 'Taught Bennett how to change a tire last weekend. Passing down what my dad taught me. Three generations of knowledge.', // A heartwarming memory about generational knowledge
      mediaURLs: [], // No photos attached
    },
    hearts: ['peggy', 'shelby', 'timothy', 'bennett'], // Four hearts
    comments: [
      // Comment from Bennett saying the skill already came in handy
      {
        id: 'comment-6-1',
        authorId: 'bennett',
        authorName: 'Bennett Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=bennett',
        text: 'Thanks Grandpa! I already used it when my friend had a flat tire.',
        createdAt: new Date('2026-01-23T15:00:00'),
      },
      // Comment from Timothy (Dad) thanking his father-in-law for the tradition
      {
        id: 'comment-6-2',
        authorId: 'timothy',
        authorName: 'Timothy Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=timothy',
        text: 'Dad, you taught me the same way. Thanks for keeping the tradition going.',
        createdAt: new Date('2026-01-23T16:00:00'),
      },
    ],
    createdAt: new Date('2026-01-23T14:30:00'),
    updatedAt: new Date('2026-01-23T14:30:00'),
  },

  // Feed Item 7: A prompt response from Ember about her favorite family tradition.
  // Type 'prompt_response' = an answer to the "What's your favorite family tradition?" prompt.
  {
    id: '7',
    type: 'prompt_response', // Response to a story prompt
    authorId: 'ember', // Posted by Ember (youngest child)
    authorName: 'Ember Herman',
    authorPhotoURL: 'https://i.pravatar.cc/150?u=ember',
    content: {
      text: "My favorite family tradition is Christmas morning breakfast. Grandma's cinnamon rolls, everyone in pajamas, and opening presents together.", // Ember's response
      promptId: 'prompt2', // Links to the second prompt in mockPrompts
      promptText: "What's your favorite family tradition?", // The original prompt question
    },
    hearts: ['peggy', 'shelby', 'ella', 'eli'], // Four hearts
    comments: [
      // Comment from Grandma Peggy offering to teach the cinnamon roll recipe
      {
        id: 'comment-7-1',
        authorId: 'peggy',
        authorName: 'Peggy Deleenheer',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=peggy',
        text: "I'm so glad you love my cinnamon rolls! I'll teach you the recipe soon.",
        createdAt: new Date('2026-01-22T12:00:00'),
      },
      // Comment from Ella agreeing about Christmas morning
      {
        id: 'comment-7-2',
        authorId: 'ella',
        authorName: 'Ella Fu',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=ella',
        text: "Same! Christmas morning is the best. Can't wait for this year!",
        createdAt: new Date('2026-01-22T13:00:00'),
      },
    ],
    createdAt: new Date('2026-01-22T11:00:00'),
    updatedAt: new Date('2026-01-22T11:00:00'),
  },

  // Feed Item 8: A milestone post from Eli about launching The Vine app itself!
  // Type 'milestone' = a significant life event (the app's launch).
  // This is a meta-reference - the developer announcing the app within the app.
  {
    id: '8',
    type: 'milestone', // Milestone post celebrating the app launch
    authorId: 'eli', // Posted by Eli (the app developer)
    authorName: 'Eli Herman',
    authorPhotoURL: 'https://i.pravatar.cc/150?u=eli',
    content: {
      text: 'Just launched The Vine app! Built it to help our family stay connected. Hope you all enjoy it.', // App launch announcement
      mediaURLs: [], // No photos attached
    },
    hearts: ['peggy', 'ron', 'shelby', 'timothy', 'ella', 'preston', 'bennett', 'ember'], // Eight hearts - everyone in the family!
    comments: [
      // Comment from Mom expressing pride
      {
        id: 'comment-8-1',
        authorId: 'shelby',
        authorName: 'Shelby Herman',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=shelby',
        text: 'So proud of you honey! This is wonderful.',
        createdAt: new Date('2026-01-21T17:00:00'),
      },
      // Comment from Preston (fellow developer) giving technical praise
      {
        id: 'comment-8-2',
        authorId: 'preston',
        authorName: 'Preston Fu',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=preston',
        text: 'Great work Eli! The app looks amazing. Fellow developer here - impressed!',
        createdAt: new Date('2026-01-21T17:30:00'),
      },
      // Comment from Grandpa Ron excited to use the app
      {
        id: 'comment-8-3',
        authorId: 'ron',
        authorName: 'Ron Deleenheer',
        authorPhotoURL: 'https://i.pravatar.cc/150?u=ron',
        text: 'Technology keeps getting better! Your grandma and I are excited to use it.',
        createdAt: new Date('2026-01-21T18:00:00'),
      },
    ],
    createdAt: new Date('2026-01-21T16:00:00'),
    updatedAt: new Date('2026-01-21T16:00:00'),
  },
];

/**
 * mockPrompts - Array of story prompts that encourage family members to share memories.
 *
 * These prompts appear as special cards in the feed, inviting users to respond
 * with their own stories. When a user responds, their answer becomes a new
 * feed item of type 'prompt_response'.
 *
 * Each Prompt has:
 *   - id: Unique identifier (e.g., 'prompt1') - referenced by prompt_response feed items
 *   - text: The question displayed to users
 *   - category: A PromptCategory string that groups prompts by topic
 *     (cast with "as const" to tell TypeScript this is a literal type, not just any string)
 *   - isActive: Boolean flag - if true, the prompt is shown to users; if false, it's hidden
 */
export const mockPrompts = [
  // Prompt 1: About parental advice - categorized under 'life_lessons'
  {
    id: 'prompt1', // This ID is referenced by feed item 3 (Shelby's response)
    text: 'What was the best advice your parents gave you?', // The question shown to users
    category: 'life_lessons' as const, // "as const" tells TypeScript this is literally 'life_lessons', not just any string
    isActive: true, // This prompt is currently active and visible to users
  },
  // Prompt 2: About family traditions - categorized under 'family_traditions'
  {
    id: 'prompt2', // This ID is referenced by feed item 7 (Ember's response)
    text: "What's your favorite family tradition?",
    category: 'family_traditions' as const, // Literal type assertion for TypeScript
    isActive: true, // Active and visible
  },
  // Prompt 3: About childhood memories - categorized under 'childhood'
  {
    id: 'prompt3', // Not yet referenced by any feed item (no one has responded yet)
    text: 'What was your favorite childhood memory?',
    category: 'childhood' as const, // Literal type assertion for TypeScript
    isActive: true, // Active and visible
  },
];
