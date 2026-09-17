import { useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import type { AppState, Turn } from '../types';
import { parseSources } from '../types';

// The site is metered like the app: a browser id in localStorage is the
// account, and it gets the same free minutes. There is nothing to buy on the
// web; when the minutes run out the Android app is the way forward.
function browserId(): string {
  try {
    const key = 'kms.uid';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function useAppConversation() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    clientTools: {
      set_searching_state: () => {
        setAppState('searching');
        return 'ok';
      },
      show_sources: ({ idea: rawIdea, sources: rawSources }: { idea: string; sources: string }) => {
        setTurns((prev) => [...prev, { idea: rawIdea ?? '', sources: parseSources(rawSources ?? '') }]);
        return 'ok';
      },
    },
    onModeChange: ({ mode }: { mode: string }) => {
      if (mode === 'speaking') setAppState('roasting');
      if (mode === 'listening') setAppState('listening');
    },
    onStatusChange: ({ status }: { status: string }) => {
      if (status === 'disconnected') setAppState('idle');
    },
    onError: (err: unknown) => {
      setError(String(err));
      setAppState('idle');
    },
  });

  const startSession = async () => {
    setError(null);
    setTurns([]);
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const res = await fetch('/api/signed-url', { headers: { 'X-KMS-User': browserId() } });
      if (res.status === 402) throw new Error('out-of-minutes');
      if (!res.ok) throw new Error('Failed to get signed URL');
      const { signedUrl } = await res.json() as { signedUrl: string };

      await conversation.startSession({
        signedUrl,
        connectionType: 'websocket',
      });
      setAppState('listening');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'out-of-minutes') {
        setError('Your free minutes on the web are used up. Get the Android app for more.');
      } else if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setError('Microphone access denied. Please allow mic access and try again.');
      } else {
        setError('Failed to connect. Please try again.');
      }
    } finally {
      setConnecting(false);
    }
  };

  const endSession = async () => {
    await conversation.endSession();
    setAppState('idle');
  };

  return { appState, connecting, turns, startSession, endSession, error };
}
