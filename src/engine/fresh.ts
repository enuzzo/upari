// Files of the day keep the same name every morning; the CDN in front of upari.earth may hold
// yesterday's copy for a while. Each build carries its own mark: asking for a file with it
// reaches the copy that came with this very build.

declare const __BUILD__: string;

export const fresh = (path: string) => `${path}${path.includes('?') ? '&' : '?'}b=${__BUILD__}`;
