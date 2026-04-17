import { notFound } from "next/navigation";
import { TransactionForm } from "../../../transaction-form";
import type { Account, Category, Transaction } from "@/lib/ledger";
import {
  getAccounts,
  getCategories,
  getTransaction,
} from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type EditTransactionPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PageData = {
  accounts: Account[];
  categories: Category[];
  transaction: Transaction | null;
  error: string | null;
};

async function loadFormData(id: string): Promise<PageData> {
  try {
    const [accounts, categories, transaction] = await Promise.all([
      getAccounts(),
      getCategories(),
      getTransaction(id),
    ]);

    return {
      accounts,
      categories,
      transaction,
      error: null,
    };
  } catch (error) {
    return {
      accounts: [],
      categories: [],
      transaction: null,
      error:
        error instanceof Error
          ? error.message
          : "取引の取得中にエラーが発生しました。",
    };
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.at(0) : value;
}

export default async function EditTransactionPage({
  params,
  searchParams,
}: EditTransactionPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { accounts, categories, transaction, error } = await loadFormData(id);
  const formError = firstParam(query.error);

  if (!error && !transaction) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold text-zinc-950">取引編集</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          登録済みの取引内容を更新します。
        </p>
      </header>

      {error ? (
        <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {formError ? (
        <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {formError}
        </div>
      ) : null}

      {transaction ? (
        <TransactionForm
          accounts={accounts}
          categories={categories}
          transaction={transaction}
        />
      ) : null}
    </main>
  );
}
