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
      return {
        title: parts[0] ?? '',
        url: parts[1] ?? '',
        description: parts[2] ?? '',
      };
    })
    .filter((s) => s.title && s.url);
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}
