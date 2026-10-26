import { CHAPTERS, type Chapter } from './chapters';
import { PEOPLE } from './people';

export interface Story { id: string; title: string; chapters: Chapter[] }

/** The documentaries, in the order they are offered. */
export const STORIES: Story[] = [
  { id: 'pianeta', title: 'Il pianeta, adesso', chapters: CHAPTERS },
  { id: 'persone', title: 'Le persone', chapters: PEOPLE },
];
