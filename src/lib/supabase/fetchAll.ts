/**
 * Supabase returns at most 1000 rows per request (PostgREST max-rows), and
 * silently truncates the rest. Page through with .range() until a short page.
 * The query passed in must have a stable order (e.g. date + id).
 */
const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  buildPage: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<{ data: T[]; error: string | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildPage(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error: error.message };
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { data: rows, error: null };
  }
}

/** Split a long id list so `.in()` filters stay within URL limits */
export function chunkIds(ids: string[], size = 100): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) chunks.push(ids.slice(i, i + size));
  return chunks;
}
