// Who is calling. The app sends its device-bound id (Android ID on a phone, a
// random id kept in localStorage in the browser) in X-KMS-User. There is no
// secret behind it: the id itself is the account. Ids are 16-64 chars of
// [A-Za-z0-9_-], which covers the 16-hex Android ID and a UUID.

const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export const USER_HEADER = 'x-kms-user';

export function getUserId(request: Request): string | null {
  const raw = request.headers.get(USER_HEADER)?.trim();
  if (!raw || !ID_PATTERN.test(raw)) return null;
  return raw;
}

export function isUserId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}
