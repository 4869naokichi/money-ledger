"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTransaction as insertTransaction } from "@/lib/supabase-rest";
import type { TransactionKind, TransactionStatus } from "@/lib/ledger";

const transactionKinds: TransactionKind[] = ["income", "expense"];
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

function redirectWithError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "登録中にエラーが発生しました。";

  redirect(`/?error=${encodeURIComponent(message.slice(0, 180))}`);
}

export async function createTransaction(formData: FormData) {
  let error: unknown = null;

  try {
    const eventDate = readRequired(formData, "event_date");
    const kind = readRequired(formData, "kind") as TransactionKind;
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
    redirectWithError(error);
  }

  revalidatePath("/");
  redirect("/?created=1");
}
