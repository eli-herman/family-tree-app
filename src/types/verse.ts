export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  theme: VerseTheme;
}

export type VerseTheme =
  | 'family'
  | 'love'
  | 'unity'
  | 'parenting'
  | 'marriage'
  | 'children'
  | 'faith'
  | 'gratitude';
