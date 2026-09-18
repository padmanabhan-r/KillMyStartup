-- KillMyStartup metered minutes. Balances live in RevenueCat (virtual currency
-- SECS); these tables only book-keep sessions, ad rewards and trial grants.
-- Apply once per database; every statement is idempotent.

CREATE TABLE IF NOT EXISTS users (
  user_id          text PRIMARY KEY,
  created_at       timestamptz NOT NULL DEFAULT now(),
  first_ip         text,
  trial_granted_at timestamptz
);
CREATE INDEX IF NOT EXISTS users_first_ip_created_idx ON users (first_ip, created_at);

CREATE TABLE IF NOT EXISTS sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text NOT NULL REFERENCES users (user_id),
  conversation_id   text UNIQUE,
  mode              text,
  allowance_seconds integer NOT NULL,
  charged_seconds   integer NOT NULL DEFAULT 0,
  charge_source     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz
);
CREATE INDEX IF NOT EXISTS sessions_user_created_idx ON sessions (user_id, created_at);

CREATE TABLE IF NOT EXISTS ad_rewards (
  transaction_id text PRIMARY KEY,
  user_id        text NOT NULL,
  seconds        integer NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
