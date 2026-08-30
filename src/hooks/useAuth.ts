import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { firebaseConfigured, getFirebaseAuth, googleProvider } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // Distinguishes "signed out" from "we do not know yet", so the UI does not
  // flash a sign-in prompt at someone who is already signed in.
  const [resolved, setResolved] = useState(!firebaseConfigured);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setResolved(true);
    });
  }, []);

  const signIn = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Sign-in is not configured');
    await signInWithPopup(auth, googleProvider());
  };

  const leave = async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  };

  return { user, resolved, signIn, signOut: leave, available: firebaseConfigured };
}
