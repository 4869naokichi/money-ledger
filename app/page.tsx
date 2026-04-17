import { TransactionForm } from "./transaction-form";
import {
  formatDate,
  formatYen,
  kindLabels,
  statusLabels,
  type Account,
  type Category,
  type Transaction,
} from "@/lib/ledger";
import { getAccounts, getCategories, getTransactions } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PageData = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  error: string | null;
};

async function loadPageData(): Promise<PageData> {
  try {
    const [accounts, categories, transactions] = await Promise.all([
      getAccounts(),
      getCategories(),
      getTransactions(),
    ]);

    return {
      accounts,
      categories,
      transactions,
      error: null,
    };
  } catch (error) {
    return {
      accounts: [],
      categories: [],
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

function getTotal(transactions: Transaction[], kind: Transaction["kind"]) {
  return transactions
    .filter((transaction) => transaction.kind === kind)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
  const tone =
    status === "cleared"
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : status === "cancelled"
        ? "border-zinc-200 bg-zinc-100 text-zinc-600"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs ${tone}`}>
      {statusLabels[status]}
    </span>
  );
}

function KindBadge({ kind }: { kind: Transaction["kind"] }) {
  const tone =
    kind === "income"
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs ${tone}`}>
      {kindLabels[kind]}
    </span>
  );
}

function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
        まだ取引がありません。最初の明細を登録してください。
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto border border-zinc-200 bg-white md:block">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-100 text-xs font-semibold text-zinc-600">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">日付</th>
              <th className="whitespace-nowrap px-4 py-3">種別</th>
              <th className="whitespace-nowrap px-4 py-3">カテゴリ</th>
              <th className="whitespace-nowrap px-4 py-3">口座</th>
              <th className="whitespace-nowrap px-4 py-3">店名 / メモ</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">金額</th>
              <th className="whitespace-nowrap px-4 py-3">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-4 font-medium text-zinc-950">
                  {formatDate(transaction.event_date)}
                </td>
                <td className="px-4 py-4">
                  <KindBadge kind={transaction.kind} />
                </td>
                <td className="px-4 py-4 text-zinc-700">
                  {transaction.categories?.name ?? "未分類"}
                </td>
                <td className="px-4 py-4 text-zinc-700">
                  {transaction.accounts?.name ?? "未設定"}
                </td>
                <td className="max-w-sm px-4 py-4 text-zinc-700">
                  <div className="font-medium text-zinc-950">
                    {transaction.merchant ?? "店名なし"}
                  </div>
                  {transaction.memo ? (
                    <div className="mt-1 break-words text-xs text-zinc-500">
                      {transaction.memo}
                    </div>
                  ) : null}
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${
                    transaction.kind === "income"
                      ? "text-teal-700"
                      : "text-rose-700"
                  }`}
                >
                  {transaction.kind === "income" ? "+" : "-"}
                  {formatYen(transaction.amount)}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={transaction.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {transactions.map((transaction) => (
          <article
            className="border border-zinc-200 bg-white p-4"
            key={transaction.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-zinc-500">
                  {formatDate(transaction.event_date)}
                </div>
                <div className="mt-1 font-semibold text-zinc-950">
                  {transaction.merchant ?? transaction.memo ?? "明細"}
                </div>
              </div>
              <div
                className={`shrink-0 text-right font-semibold ${
                  transaction.kind === "income"
                    ? "text-teal-700"
                    : "text-rose-700"
                }`}
              >
                {transaction.kind === "income" ? "+" : "-"}
                {formatYen(transaction.amount)}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <KindBadge kind={transaction.kind} />
              <StatusBadge status={transaction.status} />
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                {transaction.categories?.name ?? "未分類"}
              </span>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                {transaction.accounts?.name ?? "未設定"}
              </span>
            </div>
            {transaction.memo && transaction.merchant ? (
              <p className="mt-3 text-sm text-zinc-600">{transaction.memo}</p>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const [{ accounts, categories, transactions, error }, params] =
    await Promise.all([loadPageData(), searchParams]);
  const created = firstParam(params.created);
  const formError = firstParam(params.error);
  const incomeTotal = getTotal(transactions, "income");
  const expenseTotal = getTotal(transactions, "expense");
  const balance = incomeTotal - expenseTotal;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-6">
          <p className="text-sm font-medium text-teal-700">資産管理台帳</p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-zinc-950">
                取引一覧
              </h1>
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

        {formError ? (
          <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {formError}
          </div>
        ) : null}

        {created ? (
          <div className="border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
            取引を登録しました。
          </div>
        ) : null}

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">新規登録</h2>
            <p className="mt-1 text-sm text-zinc-600">
              日付、カテゴリ、口座、金額を入れて登録します。
            </p>
          </div>
          <TransactionForm accounts={accounts} categories={categories} />
        </section>

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
      </div>
    </main>
  );
}
