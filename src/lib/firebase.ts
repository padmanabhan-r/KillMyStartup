import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

// Firebase's web config is public by design — it identifies the project, it does
// not authorise anything. What actually protects the data is Firestore security
// rules (see SETUP_INSTRUCTIONS) plus token verification in api/signed-url.ts.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// The app has always run without accounts and must keep running without them if
// the config is absent — a missing env var should cost you sign-in, not the orb.
export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseAuth(): Auth | undefined {
  if (!firebaseConfigured) return undefined;
  if (!auth) {
    app = app ?? initializeApp(config);
    auth = getAuth(app);
  }
  return auth;
}

export function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Always let the user choose which account, rather than silently reusing the
  // one the browser happens to be signed into.
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export const projectId: string | undefined = config.projectId;
