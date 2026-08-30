import { useCallback, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import type { User } from 'firebase/auth';
import type { AppState, Turn, TranscriptEntry } from '../types';
import { parseSources } from '../types';
import { checkAccount, checkAnonymous, type Gate } from '../lib/quota';
import { addUsage, anonSessionsUsed, readUsage, recordAnonSession } from '../lib/usage';

type Blocked = Extract<Gate, { allowed: false }>['reason'];

export function useAppConversation(user: User | null) {
  const [appState, setAppState] = useState<AppState>('idle');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [secondsUsed, setSecondsUsed] = useState<number | null>(null);

  // Set while a conversation is running and cleared as soon as its time is
  // banked, so a session is counted once however it ends — the button, a
  // dropped connection, or an error.
  const startedAt = useRef<number | null>(null);

  const flushUsage = useCallback(async () => {
    const startedMs = startedAt.current;
    startedAt.current = null;
    if (startedMs === null || !user) return;

    const seconds = (Date.now() - startedMs) / 1000;
    try {
      await addUsage(user, seconds);
      setSecondsUsed((prev) => (prev ?? 0) + Math.round(seconds));
    } catch {
      // Losing one session's minutes is better than showing an error over a
      // conversation that already happened.
    }
  }, [user]);

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
    onMessage: ({ message, role }: { message: string; role: 'user' | 'agent' }) => {
      // Fires for finalised user transcriptions and agent responses alike, in
      // conversation order, which is exactly the order the transcript needs.
      if (!message) return;
      setTranscript((prev) => [...prev, { role, message }]);
    },
    onModeChange: ({ mode }: { mode: string }) => {
      if (mode === 'speaking') setAppState('roasting');
      if (mode === 'listening') setAppState('listening');
    },
    onStatusChange: ({ status }: { status: string }) => {
      if (status === 'disconnected') {
        setAppState('idle');
        void flushUsage();
      }
    },
    onError: (err: unknown) => {
      setError(String(err));
      setAppState('idle');
      void flushUsage();
    },
  });

  const startSession = async () => {
    setError(null);
    setBlocked(null);
    setTurns([]);
    setTranscript([]);

    // Check the allowance before asking for the microphone: being told you are
    // out of minutes is less annoying than a permission prompt followed by
    // being told you are out of minutes.
    let gate: Gate;
    if (user) {
      try {
        const usage = await readUsage(user);
        setSecondsUsed(usage.secondsUsed);
        gate = checkAccount(usage.secondsUsed);
      } catch {
        // An unreadable counter should not lock anyone out of a product that
        // worked without accounts until now.
        gate = { allowed: true };
      }
    } else {
      gate = checkAnonymous(anonSessionsUsed());
    }

    if (!gate.allowed) {
      setBlocked(gate.reason);
      return;
    }

    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const headers: Record<string, string> = {};
      if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

      const res = await fetch('/api/signed-url', { headers });

      if (res.status === 403) {
        setBlocked('out-of-minutes');
        return;
      }
      if (!res.ok) throw new Error('Failed to get signed URL');

      const { signedUrl } = await res.json() as { signedUrl: string };

      await conversation.startSession({ signedUrl, connectionType: 'websocket' });

      startedAt.current = Date.now();
      if (!user) recordAnonSession();
      setAppState('listening');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
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
    await flushUsage();
    setAppState('idle');
  };

  return {
    appState, connecting, turns, transcript, error,
    blocked, secondsUsed, startSession, endSession,
    dismissBlocked: () => setBlocked(null),
  };
}
