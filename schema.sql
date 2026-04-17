create extension if not exists pgcrypto;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,

  constraint accounts_name_not_blank check (btrim(name) <> ''),
  constraint accounts_type_check check (
    type in ('cash', 'bank', 'credit_card', 'e_money', 'investment', 'other')
  ),
  constraint accounts_display_order_non_negative check (display_order >= 0),
  constraint accounts_name_unique unique (name)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,

  constraint categories_name_not_blank check (btrim(name) <> ''),
  constraint categories_kind_check check (kind in ('income', 'expense')),
  constraint categories_display_order_non_negative check (display_order >= 0),
  constraint categories_kind_name_unique unique (kind, name),
  constraint categories_id_kind_unique unique (id, kind)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  kind text not null,
  category_id uuid,
  account_id uuid,
  from_account_id uuid,
  to_account_id uuid,
  payment_method text,
  merchant text,
  memo text,
  amount numeric(14, 2) not null,
  status text not null default 'cleared',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transactions_kind_check check (kind in ('income', 'expense', 'transfer')),
  constraint transactions_amount_positive check (amount > 0),
  constraint transactions_status_check check (
    status in ('planned', 'pending', 'cleared', 'cancelled')
  ),
  constraint transactions_payment_method_check check (
    payment_method is null
    or payment_method in ('cash', 'paypay', 'card', 'bank', 'other')
  ),
  constraint transactions_merchant_not_blank check (
    merchant is null or btrim(merchant) <> ''
  ),
  constraint transactions_memo_not_blank check (
    memo is null or btrim(memo) <> ''
  ),
  constraint transactions_category_required_check check (
    (kind in ('income', 'expense') and category_id is not null)
    or (kind = 'transfer' and category_id is null)
  ),
  constraint transactions_account_flow_check check (
    (
      kind in ('income', 'expense')
      and account_id is not null
      and from_account_id is null
      and to_account_id is null
    )
    or (
      kind = 'transfer'
      and account_id is null
      and from_account_id is not null
      and to_account_id is not null
      and from_account_id <> to_account_id
    )
  ),
  constraint transactions_account_id_fkey foreign key (account_id)
    references public.accounts (id)
    on update cascade
    on delete restrict,
  constraint transactions_from_account_id_fkey foreign key (from_account_id)
    references public.accounts (id)
    on update cascade
    on delete restrict,
  constraint transactions_to_account_id_fkey foreign key (to_account_id)
    references public.accounts (id)
    on update cascade
    on delete restrict,
  constraint transactions_category_kind_fkey foreign key (category_id, kind)
    references public.categories (id, kind)
    on update cascade
    on delete restrict
);

create index transactions_event_date_idx on public.transactions (event_date desc);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_from_account_id_idx on public.transactions (from_account_id);
create index transactions_to_account_id_idx on public.transactions (to_account_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_status_idx on public.transactions (status);

create table public.future_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  amount numeric(14, 2) not null,
  expected_date date not null,
  account_id uuid,
  from_account_id uuid,
  to_account_id uuid,
  status text not null default 'planned',
  note text,

  constraint future_items_name_not_blank check (btrim(name) <> ''),
  constraint future_items_kind_check check (kind in ('income', 'expense', 'transfer')),
  constraint future_items_amount_positive check (amount > 0),
  constraint future_items_status_check check (
    status in ('planned', 'done', 'cancelled')
  ),
  constraint future_items_note_not_blank check (
    note is null or btrim(note) <> ''
  ),
  constraint future_items_account_flow_check check (
    (
      kind in ('income', 'expense')
      and account_id is not null
      and from_account_id is null
      and to_account_id is null
    )
    or (
      kind = 'transfer'
      and account_id is null
      and from_account_id is not null
      and to_account_id is not null
      and from_account_id <> to_account_id
    )
  ),
  constraint future_items_account_id_fkey foreign key (account_id)
    references public.accounts (id)
    on update cascade
    on delete restrict,
  constraint future_items_from_account_id_fkey foreign key (from_account_id)
    references public.accounts (id)
    on update cascade
    on delete restrict,
  constraint future_items_to_account_id_fkey foreign key (to_account_id)
    references public.accounts (id)
    on update cascade
    on delete restrict
);

create index future_items_expected_date_idx on public.future_items (expected_date);
create index future_items_account_id_idx on public.future_items (account_id);
create index future_items_from_account_id_idx on public.future_items (from_account_id);
create index future_items_to_account_id_idx on public.future_items (to_account_id);
create index future_items_status_idx on public.future_items (status);

create table public.savings_adjustments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sign smallint not null,
  amount numeric(14, 2) not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  note text,

  constraint savings_adjustments_name_not_blank check (btrim(name) <> ''),
  constraint savings_adjustments_sign_check check (sign in (-1, 1)),
  constraint savings_adjustments_amount_positive check (amount > 0),
  constraint savings_adjustments_display_order_non_negative check (display_order >= 0),
  constraint savings_adjustments_note_not_blank check (
    note is null or btrim(note) <> ''
  )
);

create index savings_adjustments_is_active_idx
  on public.savings_adjustments (is_active, display_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

comment on table public.accounts is '資産管理台帳で利用する口座・財布・カードなどの管理先';
comment on table public.categories is '収入・支出の分類';
comment on table public.transactions is '手入力した収入・支出・振替の明細';
comment on table public.future_items is '将来予定している収入・支出・振替';
comment on table public.savings_adjustments is '貯蓄額の算出時に加算または減算する調整項目';

comment on column public.transactions.kind is 'income: 収入, expense: 支出, transfer: 振替';
comment on column public.transactions.account_id is '収入・支出の入出金先口座。振替ではnull';
comment on column public.transactions.from_account_id is '振替元口座。収入・支出ではnull';
comment on column public.transactions.to_account_id is '振替先口座。収入・支出ではnull';
comment on column public.transactions.payment_method is 'cash: 現金, paypay: PayPay, card: カード, bank: 銀行, other: その他';
comment on column public.transactions.status is 'planned: 予定, pending: 未確定, cleared: 確定, cancelled: 取消';
comment on column public.future_items.kind is 'income: 収入予定, expense: 支出予定, transfer: 振替予定';
comment on column public.future_items.account_id is '収入・支出予定の入出金先口座。振替予定ではnull';
comment on column public.future_items.from_account_id is '振替予定の振替元口座。収入・支出予定ではnull';
comment on column public.future_items.to_account_id is '振替予定の振替先口座。収入・支出予定ではnull';
comment on column public.accounts.type is 'cash, bank, credit_card, e_money, investment, other';
comment on column public.savings_adjustments.sign is '1: 加算, -1: 減算';
