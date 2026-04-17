import { AccountSection } from "../master-data-forms";
import type { Account } from "@/lib/ledger";
import { getAccounts } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type AccountsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PageData = {
  accounts: Account[];
  error: string | null;
};

async function loadAccounts(): Promise<PageData> {
  try {
    return {
      accounts: await getAccounts(),
      error: null,
    };
  } catch (error) {
    return {
      accounts: [],
      error:
        error instanceof Error
          ? error.message
          : "口座の取得中にエラーが発生しました。",
    };
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.at(0) : value;
}

export default async function AccountsPage({
  searchParams,
}: AccountsPageProps) {
  const [{ accounts, error }, params] = await Promise.all([
    loadAccounts(),
    searchParams,
  ]);
  const created = firstParam(params.created);
  const deleted = firstParam(params.deleted);
  const restored = firstParam(params.restored);
  const formError = firstParam(params.error);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold text-zinc-950">口座</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          取引に使う財布、銀行口座、カードを管理します。
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

      {created ? (
        <div className="border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          口座を追加しました。
        </div>
      ) : null}

      {deleted ? (
        <div className="border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          口座を削除しました。
        </div>
      ) : null}

      {restored ? (
        <div className="border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          削除済みの口座を復活しました。
        </div>
      ) : null}

      <AccountSection accounts={accounts} />
    </main>
  );
}
