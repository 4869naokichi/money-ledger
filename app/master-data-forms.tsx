import { createAccount, createCategory } from "./actions";
import {
  accountTypeLabels,
  kindLabels,
  type Account,
  type Category,
} from "@/lib/ledger";

type AccountSectionProps = {
  accounts: Account[];
};

type CategorySectionProps = {
  categories: Category[];
};

type MasterDataFormsProps = AccountSectionProps & CategorySectionProps;

const inputClassName =
  "h-11 rounded-md border border-zinc-300 px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const selectClassName =
  "h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export function AccountSection({ accounts }: AccountSectionProps) {
  return (
    <section className="border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-zinc-950">口座</h2>
        <p className="mt-1 text-sm text-zinc-600">
          現金、銀行口座、カードなどを登録します。
        </p>
      </div>

      <form action={createAccount} className="mt-5 grid gap-4 sm:grid-cols-5">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700" htmlFor="account-name">
            名前
          </label>
          <input
            className={inputClassName}
            id="account-name"
            name="name"
            placeholder="例: メイン銀行"
            required
            type="text"
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700" htmlFor="account-type">
            タイプ
          </label>
          <select
            className={selectClassName}
            defaultValue="bank"
            id="account-type"
            name="type"
          >
            {Object.entries(accountTypeLabels).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-zinc-700"
            htmlFor="account-display-order"
          >
            表示順
          </label>
          <input
            className={inputClassName}
            id="account-display-order"
            min="0"
            name="display_order"
            placeholder="0"
            step="1"
            type="number"
          />
        </div>

        <button
          className="h-11 rounded-md bg-teal-700 px-4 text-base font-semibold text-white transition hover:bg-teal-800 sm:col-span-5"
          type="submit"
        >
          口座を追加
        </button>
      </form>

      <div className="mt-5 border-t border-zinc-200 pt-4">
        <p className="text-sm font-medium text-zinc-700">
          登録済み {accounts.length}件
        </p>
        {accounts.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">まだ口座がありません。</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {accounts.map((account) => (
              <span
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm text-zinc-700"
                key={account.id}
              >
                {account.name} / {accountTypeLabels[account.type]}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function CategorySection({ categories }: CategorySectionProps) {
  const incomeCategories = categories.filter(
    (category) => category.kind === "income",
  );
  const expenseCategories = categories.filter(
    (category) => category.kind === "expense",
  );

  return (
    <section className="border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-zinc-950">カテゴリ</h2>
        <p className="mt-1 text-sm text-zinc-600">
          収入と支出の分類を登録します。
        </p>
      </div>

      <form action={createCategory} className="mt-5 grid gap-4 sm:grid-cols-5">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700" htmlFor="category-name">
            名前
          </label>
          <input
            className={inputClassName}
            id="category-name"
            name="name"
            placeholder="例: 食費"
            required
            type="text"
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700" htmlFor="category-kind">
            種別
          </label>
          <select
            className={selectClassName}
            defaultValue="expense"
            id="category-kind"
            name="kind"
          >
            <option value="expense">{kindLabels.expense}</option>
            <option value="income">{kindLabels.income}</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-zinc-700"
            htmlFor="category-display-order"
          >
            表示順
          </label>
          <input
            className={inputClassName}
            id="category-display-order"
            min="0"
            name="display_order"
            placeholder="0"
            step="1"
            type="number"
          />
        </div>

        <button
          className="h-11 rounded-md bg-teal-700 px-4 text-base font-semibold text-white transition hover:bg-teal-800 sm:col-span-5"
          type="submit"
        >
          カテゴリを追加
        </button>
      </form>

      <div className="mt-5 grid gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-zinc-700">
            収入 {incomeCategories.length}件
          </p>
          {incomeCategories.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              まだ収入カテゴリがありません。
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {incomeCategories.map((category) => (
                <span
                  className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-sm text-teal-800"
                  key={category.id}
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-700">
            支出 {expenseCategories.length}件
          </p>
          {expenseCategories.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              まだ支出カテゴリがありません。
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {expenseCategories.map((category) => (
                <span
                  className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-sm text-rose-800"
                  key={category.id}
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function MasterDataForms({ accounts, categories }: MasterDataFormsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AccountSection accounts={accounts} />
      <CategorySection categories={categories} />
    </div>
  );
}
