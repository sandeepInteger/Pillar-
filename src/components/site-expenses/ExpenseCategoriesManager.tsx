"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { ExpenseCategory } from "@/types/database";
import {
  addExpenseCategory,
  renameExpenseCategory,
  setExpenseCategoryActive,
} from "@/lib/actions/siteExpenses";

const inputClass =
  "rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none focus:border-[var(--primary-muted)]";

export function ExpenseCategoriesManager({
  categories,
}: {
  categories: ExpenseCategory[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<{ error?: string } | { success: boolean }>) {
    setError(null);
    setLoading(true);
    const result = await action();
    setLoading(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (await run(() => addExpenseCategory(newName))) setNewName("");
  }

  return (
    <details className="pillar-card p-5">
      <summary className="cursor-pointer text-base font-semibold">
        Expense categories
        <span className="ml-2 text-sm font-normal text-[var(--muted)]">
          ({categories.filter((c) => c.is_active).length} active)
        </span>
      </summary>

      <div className="mt-4 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <ul className="flex flex-wrap gap-2">
          {categories.map((c) =>
            editingId === c.id ? (
              <li key={c.id} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    if (await run(() => renameExpenseCategory(c.id, editName))) {
                      setEditingId(null);
                    }
                  }}
                  className="text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-[var(--muted)] hover:underline"
                >
                  Cancel
                </button>
              </li>
            ) : (
              <li
                key={c.id}
                className={`flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-sm ${
                  c.is_active ? "bg-white" : "bg-[var(--background)] text-[var(--muted)]"
                }`}
              >
                <span>{c.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditName(c.name);
                  }}
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  Rename
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => run(() => setExpenseCategoryActive(c.id, !c.is_active))}
                  className="text-xs text-[var(--muted)] hover:underline"
                >
                  {c.is_active ? "Hide" : "Show"}
                </button>
              </li>
            )
          )}
        </ul>

        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
          <input
            className={inputClass}
            placeholder="New category, e.g. Scaffolding hire"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </div>
    </details>
  );
}
