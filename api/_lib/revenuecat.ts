// RevenueCat is the ledger. Minutes are a virtual currency (code SECS, one
// unit per second) on the customer whose id is the device id. Purchases credit
// it automatically; this module is how the backend grants trial and ad time and
// charges for conversation.

const API = 'https://api.revenuecat.com/v2';

export const CURRENCY = process.env.RC_CURRENCY ?? 'SECS';

function auth(): { project: string; headers: Record<string, string> } {
  const project = process.env.RC_PROJECT_ID;
  const key = process.env.RC_SECRET_KEY;
  if (!project || !key) throw new Error('RC_PROJECT_ID / RC_SECRET_KEY are not set');
  return {
    project,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  };
}

interface BalanceItem {
  code?: string;
  virtual_currency_code?: string;
  balance?: number;
}

function pickBalance(items: BalanceItem[] | undefined): number {
  const item = items?.find((i) => (i.code ?? i.virtual_currency_code) === CURRENCY);
  const balance = item?.balance;
  return typeof balance === 'number' && Number.isFinite(balance) ? Math.max(0, balance) : 0;
}

export async function getBalance(userId: string): Promise<number> {
  const { project, headers } = auth();
  const res = await fetch(
    `${API}/projects/${project}/customers/${encodeURIComponent(userId)}/virtual_currencies`,
    { headers },
  );
  if (res.status === 404) return 0;
  if (!res.ok) throw new Error(`RevenueCat balance failed: ${res.status}`);
  const body = (await res.json()) as { items?: BalanceItem[] };
  return pickBalance(body.items);
}

export async function ensureCustomer(userId: string): Promise<void> {
  const { project, headers } = auth();
  const res = await fetch(`${API}/projects/${project}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: userId }),
  });
  // 409/422: already exists. Anything else is a real failure.
  if (!res.ok && res.status !== 409 && res.status !== 422) {
    throw new Error(`RevenueCat create customer failed: ${res.status}`);
  }
}

async function postAdjustment(userId: string, delta: number): Promise<Response> {
  const { project, headers } = auth();
  return fetch(
    `${API}/projects/${project}/customers/${encodeURIComponent(userId)}/virtual_currencies/transactions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ adjustments: { [CURRENCY]: delta } }),
    },
  );
}

// Applies a signed delta and returns the seconds actually applied. A negative
// delta larger than the balance is clipped to the balance: the user talked on
// time they had, so the account simply hits zero.
export async function adjust(userId: string, delta: number): Promise<number> {
  const rounded = Math.trunc(delta);
  if (rounded === 0) return 0;

  let res = await postAdjustment(userId, rounded);
  if (res.status === 404) {
    await ensureCustomer(userId);
    res = await postAdjustment(userId, rounded);
  }
  if (res.status === 422 && rounded < 0) {
    const balance = await getBalance(userId);
    if (balance <= 0) return 0;
    const clipped = await postAdjustment(userId, -balance);
    if (!clipped.ok) throw new Error(`RevenueCat adjust (clipped) failed: ${clipped.status}`);
    return -balance;
  }
  if (!res.ok) throw new Error(`RevenueCat adjust failed: ${res.status} ${await res.text()}`);
  return rounded;
}
