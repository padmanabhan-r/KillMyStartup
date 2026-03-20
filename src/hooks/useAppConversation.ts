import { useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import type { AppState, Turn } from '../types';
import { parseSources } from '../types';

export function useAppConversation() {
  const [appState, setAppState] = useState<AppState>('idle');
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
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const res = await fetch('/api/signed-url');
      if (!res.ok) throw new Error('Failed to get signed URL');
      const { signedUrl } = await res.json() as { signedUrl: string };

      await conversation.startSession({
        signedUrl,
        connectionType: 'websocket',
      });
      setAppState('listening');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setError('Microphone access denied. Please allow mic access and try again.');
      } else {
        setError('Failed to connect. Please try again.');
      }
    }
  };

  const endSession = async () => {
    await conversation.endSession();
    setAppState('idle');
    setTurns([]);
  };

  return { appState, turns, startSession, endSession, error };
}
