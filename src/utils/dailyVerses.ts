import { BibleVerse } from '../types/verse';

export const familyVerses: BibleVerse[] = [
  {
    id: '1',
    reference: 'John 15:5',
    text: 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.',
    theme: 'faith',
  },
  {
    id: '2',
    reference: 'Proverbs 22:6',
    text: 'Start children off on the way they should go, and even when they are old they will not turn from it.',
    theme: 'parenting',
  },
  {
    id: '3',
    reference: '1 Corinthians 13:4-7',
    text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.',
    theme: 'love',
  },
  {
    id: '4',
    reference: 'Colossians 3:14',
    text: 'And over all these virtues put on love, which binds them all together in perfect unity.',
    theme: 'unity',
  },
  {
    id: '5',
    reference: 'Psalm 127:3',
    text: 'Children are a heritage from the Lord, offspring a reward from him.',
    theme: 'children',
  },
  {
    id: '6',
    reference: 'Ephesians 4:2-3',
    text: 'Be completely humble and gentle; be patient, bearing with one another in love. Make every effort to keep the unity of the Spirit through the bond of peace.',
    theme: 'unity',
  },
  {
    id: '7',
    reference: 'Joshua 24:15',
    text: 'But as for me and my household, we will serve the Lord.',
    theme: 'family',
  },
  {
    id: '8',
    reference: 'Proverbs 17:6',
    text: 'Children\'s children are a crown to the aged, and parents are the pride of their children.',
    theme: 'family',
  },
  {
    id: '9',
    reference: '1 John 4:19',
    text: 'We love because he first loved us.',
    theme: 'love',
  },
  {
    id: '10',
    reference: 'Deuteronomy 6:6-7',
    text: 'These commandments that I give you today are to be on your hearts. Impress them on your children. Talk about them when you sit at home and when you walk along the road.',
    theme: 'parenting',
  },
  {
    id: '11',
    reference: 'Ecclesiastes 4:9-10',
    text: 'Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up.',
    theme: 'marriage',
  },
  {
    id: '12',
    reference: 'Psalm 133:1',
    text: 'How good and pleasant it is when God\'s people live together in unity!',
    theme: 'unity',
  },
  {
    id: '13',
    reference: '1 Thessalonians 5:18',
    text: 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.',
    theme: 'gratitude',
  },
  {
    id: '14',
    reference: 'Proverbs 31:28',
    text: 'Her children arise and call her blessed; her husband also, and he praises her.',
    theme: 'family',
  },
];

export function getDailyVerse(): BibleVerse {
  // Use the day of the year to cycle through verses
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const index = dayOfYear % familyVerses.length;
  return familyVerses[index];
}

export function getVerseByTheme(theme: BibleVerse['theme']): BibleVerse {
  const themeVerses = familyVerses.filter(v => v.theme === theme);
  const randomIndex = Math.floor(Math.random() * themeVerses.length);
  return themeVerses[randomIndex] || familyVerses[0];
}
