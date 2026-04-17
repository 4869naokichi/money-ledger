import { TransactionForm } from "../../transaction-form";
import type { Account, Category } from "@/lib/ledger";
import { getAccounts, getCategories } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type NewTransactionPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PageData = {
  accounts: Account[];
  categories: Category[];
  error: string | null;
};

async function loadFormData(): Promise<PageData> {
  try {
    const [accounts, categories] = await Promise.all([
      getAccounts(),
      getCategories(),
    ]);

    return {
      accounts,
      categories,
      error: null,
    };
  } catch (error) {
    return {
      accounts: [],
      categories: [],
      error:
        error instanceof Error
          ? error.message
          : "登録フォームの準備中にエラーが発生しました。",
    };
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.at(0) : value;
}

export default async function NewTransactionPage({
  searchParams,
}: NewTransactionPageProps) {
  const [{ accounts, categories, error }, params] = await Promise.all([
    loadFormData(),
    searchParams,
  ]);
  const formError = firstParam(params.error);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold text-zinc-950">新規登録</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          日付、カテゴリ、口座、金額を入れて取引を登録します。
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

      <TransactionForm accounts={accounts} categories={categories} />
    </main>
  );
}
