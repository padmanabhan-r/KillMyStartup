export type AppState = 'idle' | 'listening' | 'searching' | 'roasting';

export interface Source {
  title: string;
  url: string;
  description: string;
}

export interface Turn {
  idea: string;
  sources: Source[];
}

export function parseSources(raw: string): Source[] {
  return raw
    .split(';;')
    .map((s) => {
      const parts = s.split('|').map((x) => x.trim());
      const urlIndex = parts.findIndex((p) => p.startsWith('http'));
      if (urlIndex === -1) return null;
      const url = parts[urlIndex];
      const title = parts.slice(0, urlIndex).join('|').trim() || (parts[0] ?? '');
      const description = parts.slice(urlIndex + 1).join('|').trim();
      return { title, url, description };
    })
    .filter((s): s is Source => s !== null && !!s.title && !!s.url);
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}
