import {
  formatDate,
  formatYen,
  kindLabels,
  statusLabels,
  type Transaction,
} from "@/lib/ledger";

export function getTransactionTotal(
  transactions: Transaction[],
  kind: Transaction["kind"],
) {
  return transactions
    .filter((transaction) => transaction.kind === kind)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function getCategoryLabel(transaction: Transaction) {
  if (transaction.kind === "transfer") {
    return "振替";
  }

  return transaction.categories?.name ?? "未分類";
}

function getAccountLabel(transaction: Transaction) {
  if (transaction.kind === "transfer") {
    const from = transaction.from_account?.name ?? "未設定";
    const to = transaction.to_account?.name ?? "未設定";

    return `${from} → ${to}`;
  }

  return transaction.account?.name ?? "未設定";
}

function getAmountPrefix(kind: Transaction["kind"]) {
  if (kind === "income") {
    return "+";
  }

  if (kind === "expense") {
    return "-";
  }

  return "";
}

function getAmountTone(kind: Transaction["kind"]) {
  if (kind === "income") {
    return "text-teal-700";
  }

  if (kind === "expense") {
    return "text-rose-700";
  }

  return "text-zinc-700";
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
      : kind === "expense"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs ${tone}`}>
      {kindLabels[kind]}
    </span>
  );
}

export function TransactionTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
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
                  {getCategoryLabel(transaction)}
                </td>
                <td className="px-4 py-4 text-zinc-700">
                  {getAccountLabel(transaction)}
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
                  className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${getAmountTone(transaction.kind)}`}
                >
                  {getAmountPrefix(transaction.kind)}
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
                className={`shrink-0 text-right font-semibold ${getAmountTone(transaction.kind)}`}
              >
                {getAmountPrefix(transaction.kind)}
                {formatYen(transaction.amount)}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <KindBadge kind={transaction.kind} />
              <StatusBadge status={transaction.status} />
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                {getCategoryLabel(transaction)}
              </span>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                {getAccountLabel(transaction)}
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
