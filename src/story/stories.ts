import { CHAPTERS, type Chapter } from './chapters';
import { PEOPLE } from './people';
import { NATURE } from './nature';

export interface Story { id: string; title: string; chapters: Chapter[] }

/** The documentaries, in the order they are offered. */
export const STORIES: Story[] = [
  { id: 'pianeta', title: 'Il pianeta, adesso', chapters: CHAPTERS },
  { id: 'natura', title: 'La natura', chapters: NATURE },
  { id: 'persone', title: 'Le persone', chapters: PEOPLE },
];
