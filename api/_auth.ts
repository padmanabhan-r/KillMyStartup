import { createRemoteJWKSet, jwtVerify } from 'jose';

// Firebase ID tokens are RS256 JWTs signed with Google's rotating keys. The
// Edge runtime cannot use firebase-admin, so they are verified directly against
// the published key set — createRemoteJWKSet caches and refreshes the keys, so
// this is not a fetch per request.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export interface VerifiedUser {
  uid: string;
  email?: string;
}

export function bearerToken(request: Request): string | undefined {
  const header = request.headers.get('authorization');
  if (!header?.toLowerCase().startsWith('bearer ')) return undefined;
  return header.slice(7).trim() || undefined;
}

// Returns undefined for any token that is absent, malformed, expired, or issued
// for a different Firebase project. Callers decide whether that is fatal.
export async function verifyIdToken(
  token: string,
  firebaseProjectId: string,
): Promise<VerifiedUser | undefined> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${firebaseProjectId}`,
      audience: firebaseProjectId,
    });

    // Firebase puts the user id in `sub`; `user_id` mirrors it. A token without
    // one is not a usable identity even if the signature checks out.
    const uid = typeof payload.sub === 'string' ? payload.sub : undefined;
    if (!uid) return undefined;

    return { uid, email: typeof payload.email === 'string' ? payload.email : undefined };
  } catch {
    return undefined;
  }
}
