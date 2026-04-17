import { CategorySection } from "../master-data-forms";
import type { Category } from "@/lib/ledger";
import { getCategories } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type CategoriesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PageData = {
  categories: Category[];
  error: string | null;
};

async function loadCategories(): Promise<PageData> {
  try {
    return {
      categories: await getCategories(),
      error: null,
    };
  } catch (error) {
    return {
      categories: [],
      error:
        error instanceof Error
          ? error.message
          : "カテゴリの取得中にエラーが発生しました。",
    };
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.at(0) : value;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const [{ categories, error }, params] = await Promise.all([
    loadCategories(),
    searchParams,
  ]);
  const created = firstParam(params.created);
  const deleted = firstParam(params.deleted);
  const restored = firstParam(params.restored);
  const formError = firstParam(params.error);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold text-zinc-950">カテゴリ</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          収入と支出の分類を管理します。
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
          カテゴリを追加しました。
        </div>
      ) : null}

      {deleted ? (
        <div className="border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          カテゴリを削除しました。
        </div>
      ) : null}

      {restored ? (
        <div className="border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          削除済みのカテゴリを復活しました。
        </div>
      ) : null}

      <CategorySection categories={categories} />
    </main>
  );
}
