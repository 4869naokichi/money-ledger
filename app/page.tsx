import { getTransactionTotal, TransactionTable } from "./transaction-list";
import { formatYen, type Transaction } from "@/lib/ledger";
import { getTransactions } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PageData = {
  transactions: Transaction[];
  error: string | null;
};

async function loadTransactions(): Promise<PageData> {
  try {
    return {
      transactions: await getTransactions(),
      error: null,
    };
  } catch (error) {
    return {
      transactions: [],
      error:
        error instanceof Error
          ? error.message
          : "データの取得中にエラーが発生しました。",
    };
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.at(0) : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const [{ transactions, error }, params] = await Promise.all([
    loadTransactions(),
    searchParams,
  ]);
  const created = firstParam(params.created);
  const incomeTotal = getTransactionTotal(transactions, "income");
  const expenseTotal = getTransactionTotal(transactions, "expense");
  const balance = incomeTotal - expenseTotal;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-zinc-200 pb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950">取引一覧</h1>
            <p className="mt-2 max-w-2xl text-zinc-600">
              毎日の収入と支出を手入力で記録します。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-lg">
            <div className="border border-zinc-200 bg-white p-4">
              <div className="text-xs font-medium text-zinc-500">収入</div>
              <div className="mt-2 text-lg font-semibold text-teal-700">
                {formatYen(incomeTotal)}
              </div>
            </div>
            <div className="border border-zinc-200 bg-white p-4">
              <div className="text-xs font-medium text-zinc-500">支出</div>
              <div className="mt-2 text-lg font-semibold text-rose-700">
                {formatYen(expenseTotal)}
              </div>
            </div>
            <div className="border border-zinc-200 bg-white p-4">
              <div className="text-xs font-medium text-zinc-500">差額</div>
              <div
                className={`mt-2 text-lg font-semibold ${
                  balance >= 0 ? "text-teal-700" : "text-rose-700"
                }`}
              >
                {formatYen(balance)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {created ? (
        <div className="border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          取引を登録しました。
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">明細</h2>
            <p className="mt-1 text-sm text-zinc-600">
              直近50件を日付の新しい順に表示します。
            </p>
          </div>
          <p className="text-sm text-zinc-500">{transactions.length}件</p>
        </div>
        <TransactionTable transactions={transactions} />
      </section>
    </main>
  );
}
