begin;

alter table public.users
  add column if not exists password_reset_token_hash text,
  add column if not exists password_reset_expires_at timestamptz;

create index if not exists idx_users_password_reset_token_hash
  on public.users(password_reset_token_hash);

commit;
