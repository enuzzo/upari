import { CHAPTERS, type Chapter } from './chapters';
import { PEOPLE } from './people';
import { NATURE } from './nature';
import { t } from '../i18n';

type StoryId = keyof typeof t.stories;
export interface Story { id: StoryId; readonly title: string; chapters: Chapter[] }

const story = (id: StoryId, chapters: Chapter[]): Story => ({ id, get title() { return t.stories[id]; }, chapters });

/** The documentaries, in the order they are offered. */
export const STORIES: Story[] = [story('pianeta', CHAPTERS), story('natura', NATURE), story('persone', PEOPLE)];
