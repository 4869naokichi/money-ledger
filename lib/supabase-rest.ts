import type { Account, Category, Transaction } from "./ledger";

type AccountInsert = {
  name: string;
  type: Account["type"];
  display_order: number;
};

type CategoryInsert = {
  name: string;
  kind: Category["kind"];
  display_order: number;
};

type TransactionWrite = {
  event_date: string;
  kind: Transaction["kind"];
  category_id: string | null;
  account_id: string | null;
  from_account_id: string | null;
  to_account_id: string | null;
  payment_method: string | null;
  merchant: string | null;
  memo: string | null;
  amount: number;
  status: "planned" | "pending" | "cleared" | "cancelled";
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      ".env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください。",
    );
  }

  return {
    restUrl: `${url.replace(/\/$/, "")}/rest/v1`,
    key,
  };
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}) {
  const { restUrl, key } = getSupabaseConfig();
  const headers = new Headers(init.headers);

  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${restUrl}/${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    let message = response.statusText;

    try {
      const body = (await response.json()) as { message?: string; details?: string };
      message = body.message ?? body.details ?? message;
    } catch {
      const text = await response.text();
      message = text || message;
    }

    throw new Error(`Supabase API error (${response.status}): ${message}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return null as T;
  }

  return (await response.json()) as T;
}

function query(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

export async function getAccounts() {
  return supabaseRequest<Account[]>(
    `accounts?${query({
      select: "id,name,type,is_active,display_order",
      is_active: "eq.true",
      order: "display_order.asc,name.asc",
    })}`,
  );
}

export async function getAccountByName(name: string) {
  const accounts = await supabaseRequest<Account[]>(
    `accounts?${query({
      select: "id,name,type,is_active,display_order",
      name: `eq.${name}`,
      limit: "1",
    })}`,
  );

  return accounts.at(0) ?? null;
}

export async function getCategories() {
  return supabaseRequest<Category[]>(
    `categories?${query({
      select: "id,name,kind,is_active,display_order",
      is_active: "eq.true",
      order: "kind.asc,display_order.asc,name.asc",
    })}`,
  );
}

export async function getCategoryByNameAndKind(
  name: string,
  kind: Category["kind"],
) {
  const categories = await supabaseRequest<Category[]>(
    `categories?${query({
      select: "id,name,kind,is_active,display_order",
      name: `eq.${name}`,
      kind: `eq.${kind}`,
      limit: "1",
    })}`,
  );

  return categories.at(0) ?? null;
}

export async function getTransactions() {
  return supabaseRequest<Transaction[]>(
    `transactions?${query({
      select:
        "id,event_date,kind,category_id,account_id,from_account_id,to_account_id,payment_method,merchant,memo,amount,status,due_date,created_at,updated_at,account:accounts!transactions_account_id_fkey(name),from_account:accounts!transactions_from_account_id_fkey(name),to_account:accounts!transactions_to_account_id_fkey(name),categories(name,kind)",
      order: "event_date.desc,created_at.desc",
      limit: "50",
    })}`,
  );
}

export async function getTransaction(id: string) {
  const transactions = await supabaseRequest<Transaction[]>(
    `transactions?${query({
      select:
        "id,event_date,kind,category_id,account_id,from_account_id,to_account_id,payment_method,merchant,memo,amount,status,due_date,created_at,updated_at,account:accounts!transactions_account_id_fkey(name),from_account:accounts!transactions_from_account_id_fkey(name),to_account:accounts!transactions_to_account_id_fkey(name),categories(name,kind)",
      id: `eq.${id}`,
      limit: "1",
    })}`,
  );

  return transactions.at(0) ?? null;
}

export async function createAccount(payload: AccountInsert) {
  await supabaseRequest<null>("accounts", {
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
}

export async function createCategory(payload: CategoryInsert) {
  await supabaseRequest<null>("categories", {
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
}

export async function reactivateAccount(id: string, payload: AccountInsert) {
  await supabaseRequest<null>(`accounts?${query({ id: `eq.${id}` })}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      ...payload,
      is_active: true,
    }),
  });
}

export async function reactivateCategory(id: string, payload: CategoryInsert) {
  await supabaseRequest<null>(`categories?${query({ id: `eq.${id}` })}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      ...payload,
      is_active: true,
    }),
  });
}

export async function deactivateAccount(id: string) {
  await supabaseRequest<null>(`accounts?${query({ id: `eq.${id}` })}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ is_active: false }),
  });
}

export async function deactivateCategory(id: string) {
  await supabaseRequest<null>(`categories?${query({ id: `eq.${id}` })}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ is_active: false }),
  });
}

export async function createTransaction(payload: TransactionWrite) {
  await supabaseRequest<null>("transactions", {
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateTransaction(id: string, payload: TransactionWrite) {
  await supabaseRequest<null>(`transactions?${query({ id: `eq.${id}` })}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteTransaction(id: string) {
  await supabaseRequest<null>(`transactions?${query({ id: `eq.${id}` })}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  });
}
