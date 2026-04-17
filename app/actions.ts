"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAccount as insertAccount,
  createCategory as insertCategory,
  createTransaction as insertTransaction,
  deactivateAccount,
  deactivateCategory,
  deleteTransaction as removeTransaction,
  getAccountByName,
  getCategoryByNameAndKind,
  reactivateAccount,
  reactivateCategory,
  updateTransaction as patchTransaction,
} from "@/lib/supabase-rest";
import type {
  AccountType,
  CategoryKind,
  TransactionKind,
  TransactionStatus,
} from "@/lib/ledger";

const accountTypes: AccountType[] = [
  "cash",
  "bank",
  "credit_card",
  "e_money",
  "investment",
  "other",
];
const categoryKinds: CategoryKind[] = ["income", "expense"];
const transactionKinds: TransactionKind[] = ["income", "expense", "transfer"];
const transactionStatuses: TransactionStatus[] = [
  "planned",
  "pending",
  "cleared",
  "cancelled",
];

function readRequired(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("必須項目を入力してください。");
  }

  return value.trim();
}

function readOptional(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function readDisplayOrder(formData: FormData) {
  const value = readOptional(formData, "display_order");

  if (value === null) {
    return 0;
  }

  const displayOrder = Number(value);

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    throw new Error("表示順は0以上の整数で入力してください。");
  }

  return displayOrder;
}

function readTransactionPayload(formData: FormData) {
  const eventDate = readRequired(formData, "event_date");
  const kind = readRequired(formData, "kind") as TransactionKind;
  const amount = Number(readRequired(formData, "amount"));
  const status = readRequired(formData, "status") as TransactionStatus;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    throw new Error("日付を正しく入力してください。");
  }

  if (!transactionKinds.includes(kind)) {
    throw new Error("収入、支出、振替のいずれかを選択してください。");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("金額は1円以上で入力してください。");
  }

  if (!transactionStatuses.includes(status)) {
    throw new Error("状態を正しく選択してください。");
  }

  if (kind === "transfer") {
    const fromAccountId = readRequired(formData, "from_account_id");
    const toAccountId = readRequired(formData, "to_account_id");

    if (fromAccountId === toAccountId) {
      throw new Error("振替元と振替先には別の口座を選択してください。");
    }

    return {
      event_date: eventDate,
      kind,
      category_id: null,
      account_id: null,
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      payment_method: null,
      merchant: readOptional(formData, "merchant"),
      memo: readOptional(formData, "memo"),
      amount,
      status,
    };
  }

  return {
    event_date: eventDate,
    kind,
    category_id: readRequired(formData, "category_id"),
    account_id: readRequired(formData, "account_id"),
    from_account_id: null,
    to_account_id: null,
    payment_method: null,
    merchant: readOptional(formData, "merchant"),
    memo: readOptional(formData, "memo"),
    amount,
    status,
  };
}

function redirectWithError(error: unknown, path = "/"): never {
  const message =
    error instanceof Error ? error.message : "登録中にエラーが発生しました。";

  redirect(`${path}?error=${encodeURIComponent(message.slice(0, 180))}`);
}

export async function createAccount(formData: FormData) {
  let error: unknown = null;
  let restored = false;

  try {
    const name = readRequired(formData, "name");
    const type = readRequired(formData, "type") as AccountType;
    const displayOrder = readDisplayOrder(formData);

    if (!accountTypes.includes(type)) {
      throw new Error("口座タイプを正しく選択してください。");
    }

    const existingAccount = await getAccountByName(name);
    const payload = {
      name,
      type,
      display_order: displayOrder,
    };

    if (existingAccount?.is_active) {
      throw new Error("同じ名前の口座はすでに登録されています。");
    }

    if (existingAccount) {
      await reactivateAccount(existingAccount.id, payload);
      restored = true;
    } else {
      await insertAccount(payload);
    }
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, "/accounts");
  }

  revalidatePath("/accounts");
  revalidatePath("/transactions/new");
  redirect(restored ? "/accounts?restored=1" : "/accounts?created=1");
}

export async function deleteAccount(formData: FormData) {
  let error: unknown = null;

  try {
    await deactivateAccount(readRequired(formData, "id"));
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, "/accounts");
  }

  revalidatePath("/accounts");
  revalidatePath("/transactions/new");
  redirect("/accounts?deleted=1");
}

export async function createCategory(formData: FormData) {
  let error: unknown = null;
  let restored = false;

  try {
    const name = readRequired(formData, "name");
    const kind = readRequired(formData, "kind") as CategoryKind;
    const displayOrder = readDisplayOrder(formData);

    if (!categoryKinds.includes(kind)) {
      throw new Error("カテゴリ種別を正しく選択してください。");
    }

    const existingCategory = await getCategoryByNameAndKind(name, kind);
    const payload = {
      name,
      kind,
      display_order: displayOrder,
    };

    if (existingCategory?.is_active) {
      throw new Error("同じ種別・同じ名前のカテゴリはすでに登録されています。");
    }

    if (existingCategory) {
      await reactivateCategory(existingCategory.id, payload);
      restored = true;
    } else {
      await insertCategory(payload);
    }
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, "/categories");
  }

  revalidatePath("/categories");
  revalidatePath("/transactions/new");
  redirect(restored ? "/categories?restored=1" : "/categories?created=1");
}

export async function deleteCategory(formData: FormData) {
  let error: unknown = null;

  try {
    await deactivateCategory(readRequired(formData, "id"));
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, "/categories");
  }

  revalidatePath("/categories");
  revalidatePath("/transactions/new");
  redirect("/categories?deleted=1");
}

export async function createTransaction(formData: FormData) {
  let error: unknown = null;

  try {
    await insertTransaction(readTransactionPayload(formData));
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, "/transactions/new");
  }

  revalidatePath("/");
  redirect("/?created=1");
}

export async function updateTransaction(formData: FormData) {
  let id = "";
  let error: unknown = null;

  try {
    id = readRequired(formData, "id");
    await patchTransaction(id, readTransactionPayload(formData));
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, id ? `/transactions/${id}/edit` : "/");
  }

  revalidatePath("/");
  revalidatePath(`/transactions/${id}/edit`);
  redirect("/?updated=1");
}

export async function deleteTransaction(formData: FormData) {
  let error: unknown = null;

  try {
    await removeTransaction(readRequired(formData, "id"));
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, "/");
  }

  revalidatePath("/");
  redirect("/?deleted=1");
}
