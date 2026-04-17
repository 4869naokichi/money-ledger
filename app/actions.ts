"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAccount as insertAccount,
  createCategory as insertCategory,
  createTransaction as insertTransaction,
} from "@/lib/supabase-rest";
import type {
  AccountType,
  CategoryKind,
  TransactionKind,
  TransactionStatus,
} from "@/lib/ledger";

type EntryKind = Exclude<TransactionKind, "transfer">;

const accountTypes: AccountType[] = [
  "cash",
  "bank",
  "credit_card",
  "e_money",
  "investment",
  "other",
];
const categoryKinds: CategoryKind[] = ["income", "expense"];
const transactionKinds: EntryKind[] = ["income", "expense"];
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

function redirectWithError(error: unknown, path = "/"): never {
  const message =
    error instanceof Error ? error.message : "登録中にエラーが発生しました。";

  redirect(`${path}?error=${encodeURIComponent(message.slice(0, 180))}`);
}

export async function createAccount(formData: FormData) {
  let error: unknown = null;

  try {
    const name = readRequired(formData, "name");
    const type = readRequired(formData, "type") as AccountType;

    if (!accountTypes.includes(type)) {
      throw new Error("口座タイプを正しく選択してください。");
    }

    await insertAccount({
      name,
      type,
      display_order: readDisplayOrder(formData),
    });
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, "/accounts");
  }

  revalidatePath("/accounts");
  revalidatePath("/transactions/new");
  redirect("/accounts?created=1");
}

export async function createCategory(formData: FormData) {
  let error: unknown = null;

  try {
    const name = readRequired(formData, "name");
    const kind = readRequired(formData, "kind") as CategoryKind;

    if (!categoryKinds.includes(kind)) {
      throw new Error("カテゴリ種別を正しく選択してください。");
    }

    await insertCategory({
      name,
      kind,
      display_order: readDisplayOrder(formData),
    });
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, "/categories");
  }

  revalidatePath("/categories");
  revalidatePath("/transactions/new");
  redirect("/categories?created=1");
}

export async function createTransaction(formData: FormData) {
  let error: unknown = null;

  try {
    const eventDate = readRequired(formData, "event_date");
    const kind = readRequired(formData, "kind") as EntryKind;
    const categoryId = readRequired(formData, "category_id");
    const accountId = readRequired(formData, "account_id");
    const amount = Number(readRequired(formData, "amount"));
    const status = readRequired(formData, "status") as TransactionStatus;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      throw new Error("日付を正しく入力してください。");
    }

    if (!transactionKinds.includes(kind)) {
      throw new Error("収入または支出を選択してください。");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("金額は1円以上で入力してください。");
    }

    if (!transactionStatuses.includes(status)) {
      throw new Error("状態を正しく選択してください。");
    }

    await insertTransaction({
      event_date: eventDate,
      kind,
      category_id: categoryId,
      account_id: accountId,
      payment_method: null,
      merchant: readOptional(formData, "merchant"),
      memo: readOptional(formData, "memo"),
      amount,
      status,
    });
  } catch (caughtError) {
    error = caughtError;
  }

  if (error) {
    redirectWithError(error, "/transactions/new");
  }

  revalidatePath("/");
  redirect("/?created=1");
}
