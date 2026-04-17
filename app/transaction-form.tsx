"use client";

import { useMemo, useState } from "react";
import { createTransaction, updateTransaction } from "./actions";
import {
  accountTypeLabels,
  kindLabels,
  statusLabels,
  type Account,
  type Category,
  type Transaction,
  type TransactionKind,
  type TransactionStatus,
} from "@/lib/ledger";

type TransactionFormProps = {
  accounts: Account[];
  categories: Category[];
  transaction?: Transaction;
};

const statusOptions: TransactionStatus[] = [
  "cleared",
  "pending",
  "planned",
  "cancelled",
];

function getLocalDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function getDefaultKind(
  categories: Category[],
  transaction?: Transaction,
): TransactionKind {
  if (transaction) {
    return transaction.kind;
  }

  return categories.some((category) => category.kind === "expense")
    ? "expense"
    : "income";
}

export function TransactionForm({
  accounts,
  categories,
  transaction,
}: TransactionFormProps) {
  const isEditing = Boolean(transaction);
  const [kind, setKind] = useState<TransactionKind>(
    getDefaultKind(categories, transaction),
  );
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === kind),
    [categories, kind],
  );
  const isTransfer = kind === "transfer";
  const canSubmit = isTransfer
    ? accounts.length >= 2
    : accounts.length > 0 && filteredCategories.length > 0;
  const action = isEditing ? updateTransaction : createTransaction;
  const submitLabel = isEditing ? "更新する" : "登録する";
  const categoryDefaultValue =
    transaction?.kind === kind && transaction.category_id
      ? transaction.category_id
      : (filteredCategories.at(0)?.id ?? "");
  const fromAccountDefaultValue =
    transaction?.kind === "transfer" && transaction.from_account_id
      ? transaction.from_account_id
      : (accounts.at(0)?.id ?? "");
  const toAccountDefaultValue =
    transaction?.kind === "transfer" && transaction.to_account_id
      ? transaction.to_account_id
      : (accounts.at(1)?.id ?? accounts.at(0)?.id ?? "");

  return (
    <form
      action={action}
      className="grid gap-5 border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
    >
      {transaction ? (
        <input name="id" type="hidden" value={transaction.id} />
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="event_date">
          日付
        </label>
        <input
          className="h-11 rounded-md border border-zinc-300 px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          defaultValue={transaction?.event_date ?? getLocalDate()}
          id="event_date"
          name="event_date"
          required
          type="date"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="kind">
          種別
        </label>
        <select
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          id="kind"
          name="kind"
          onChange={(event) => setKind(event.target.value as TransactionKind)}
          value={kind}
        >
          <option value="expense">{kindLabels.expense}</option>
          <option value="income">{kindLabels.income}</option>
          <option value="transfer">{kindLabels.transfer}</option>
        </select>
      </div>

      {isTransfer ? (
        <>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-zinc-700"
              htmlFor="from_account_id"
            >
              振替元
            </label>
            <select
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100 disabled:text-zinc-500"
              defaultValue={fromAccountDefaultValue}
              disabled={accounts.length === 0}
              id="from_account_id"
              key={`from-${transaction?.id ?? "new"}`}
              name="from_account_id"
              required
            >
              {accounts.length === 0 ? (
                <option value="">口座未登録</option>
              ) : (
                accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}（{accountTypeLabels[account.type]}）
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-zinc-700"
              htmlFor="to_account_id"
            >
              振替先
            </label>
            <select
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100 disabled:text-zinc-500"
              defaultValue={toAccountDefaultValue}
              disabled={accounts.length === 0}
              id="to_account_id"
              key={`to-${transaction?.id ?? "new"}`}
              name="to_account_id"
              required
            >
              {accounts.length === 0 ? (
                <option value="">口座未登録</option>
              ) : (
                accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}（{accountTypeLabels[account.type]}）
                  </option>
                ))
              )}
            </select>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-zinc-700"
              htmlFor="category_id"
            >
              カテゴリ
            </label>
            <select
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100 disabled:text-zinc-500"
              defaultValue={categoryDefaultValue}
              disabled={filteredCategories.length === 0}
              id="category_id"
              key={kind}
              name="category_id"
              required
            >
              {filteredCategories.length === 0 ? (
                <option value="">カテゴリ未登録</option>
              ) : (
                filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-zinc-700"
              htmlFor="account_id"
            >
              口座
            </label>
            <select
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-zinc-100 disabled:text-zinc-500"
              defaultValue={
                transaction?.kind !== "transfer" && transaction?.account_id
                  ? transaction.account_id
                  : (accounts.at(0)?.id ?? "")
              }
              disabled={accounts.length === 0}
              id="account_id"
              name="account_id"
              required
            >
              {accounts.length === 0 ? (
                <option value="">口座未登録</option>
              ) : (
                accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}（{accountTypeLabels[account.type]}）
                  </option>
                ))
              )}
            </select>
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="merchant">
          店名
        </label>
        <input
          className="h-11 rounded-md border border-zinc-300 px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          defaultValue={transaction?.merchant ?? ""}
          id="merchant"
          name="merchant"
          placeholder="例: スーパー"
          type="text"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="amount">
          金額
        </label>
        <input
          className="h-11 rounded-md border border-zinc-300 px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          defaultValue={transaction?.amount ?? ""}
          id="amount"
          inputMode="numeric"
          min="1"
          name="amount"
          placeholder="0"
          required
          step="1"
          type="number"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700" htmlFor="status">
          状態
        </label>
        <select
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          defaultValue={transaction?.status ?? "cleared"}
          id="status"
          name="status"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
        <label className="text-sm font-medium text-zinc-700" htmlFor="memo">
          メモ
        </label>
        <textarea
          className="min-h-24 rounded-md border border-zinc-300 px-3 py-2 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          defaultValue={transaction?.memo ?? ""}
          id="memo"
          name="memo"
          placeholder="任意でメモを残せます"
        />
      </div>

      {!canSubmit ? (
        <p className="text-sm text-rose-700 sm:col-span-2 lg:col-span-3">
          {isTransfer
            ? "振替を登録するには、口座を2件以上登録してください。"
            : "取引を登録するには、先に口座とカテゴリを登録してください。"}
        </p>
      ) : (
        <div className="hidden lg:block lg:col-span-3" />
      )}

      <button
        className="h-11 rounded-md bg-teal-700 px-4 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 sm:col-span-2 lg:col-span-1"
        disabled={!canSubmit}
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}
