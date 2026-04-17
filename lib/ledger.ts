export type TransactionKind = "income" | "expense" | "transfer";
export type TransactionStatus = "planned" | "pending" | "cleared" | "cancelled";
export type AccountType =
  | "cash"
  | "bank"
  | "credit_card"
  | "e_money"
  | "investment"
  | "other";
export type CategoryKind = Exclude<TransactionKind, "transfer">;

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  is_active: boolean;
  display_order: number;
};

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  is_active: boolean;
  display_order: number;
};

export type Transaction = {
  id: string;
  event_date: string;
  kind: TransactionKind;
  category_id: string | null;
  account_id: string | null;
  from_account_id: string | null;
  to_account_id: string | null;
  payment_method: string | null;
  merchant: string | null;
  memo: string | null;
  amount: string | number;
  status: TransactionStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  account: Pick<Account, "name"> | null;
  from_account: Pick<Account, "name"> | null;
  to_account: Pick<Account, "name"> | null;
  categories: Pick<Category, "name" | "kind"> | null;
};

export const kindLabels: Record<TransactionKind, string> = {
  income: "収入",
  expense: "支出",
  transfer: "振替",
};

export const statusLabels: Record<TransactionStatus, string> = {
  planned: "予定",
  pending: "未確定",
  cleared: "確定",
  cancelled: "取消",
};

export const accountTypeLabels: Record<AccountType, string> = {
  cash: "現金",
  bank: "銀行",
  credit_card: "クレジットカード",
  e_money: "電子マネー",
  investment: "投資",
  other: "その他",
};

export function formatDate(date: string) {
  return date.replaceAll("-", "/");
}

export function formatYen(amount: string | number) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "¥0";
  }

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}
