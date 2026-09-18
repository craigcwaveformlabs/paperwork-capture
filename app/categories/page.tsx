import { isConnected } from '@/lib/freeagent/client';
import {
  categoryIdFromUrl,
  listBridgingCategories,
  EDITABLE_CATEGORY_GROUPS,
} from '@/lib/freeagent/bridgingCategories';

export default async function FreeAgentCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; skipped?: string; failed?: string; msg?: string; error?: string; edit?: string }>;
}) {
  const { created, skipped, failed, msg, error, edit } = await searchParams;

  if (!isConnected()) {
    return (
      <section className="bg-white border border-line rounded-lg p-4">
        <p className="text-sm">
          Not connected yet — go to <a href="/connection" className="text-link underline">Live FreeAgent</a> and connect first.
        </p>
      </section>
    );
  }

  const categories = await listBridgingCategories();
  categories.sort((a, b) => a.nominal_code.localeCompare(b.nominal_code));

  return (
    <section className="bg-white border border-line rounded-lg overflow-hidden">
      <header className="p-4 border-b border-line flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">MTD bridging categories</h2>
          <p className="text-sm text-slate-600 mt-1">
            Custom categories used to keep bridging-sourced transactions distinct from normal bookkeeping.
          </p>
        </div>
        <form action="/api/categories" method="POST">
          <button type="submit" className="bg-blue text-white text-sm font-medium px-4 py-2 rounded">
            Create preset bridging categories
          </button>
        </form>
      </header>

      {created || skipped || failed ? (
        <p className="text-sm p-4 border-b border-line bg-pageBg">
          Created {created ?? 0}, skipped {skipped ?? 0} (already existed), failed {failed ?? 0}.
        </p>
      ) : null}
      {msg ? <p className="text-sm p-4 border-b border-line bg-pageBg text-tick">{msg}</p> : null}
      {error ? <p className="text-sm p-4 border-b border-line bg-orangeBg text-orange">{error}</p> : null}

      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="p-2">Nominal code</th>
              <th className="p-2">Description</th>
              <th className="p-2 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => {
              const id = categoryIdFromUrl(c.url);
              const isEditing = edit === id;

              if (isEditing) {
                return (
                  <tr key={c.url} className="border-b border-line/60 bg-pageBg">
                    <td className="p-2" colSpan={3}>
                      <form action={`/api/categories/${id}/update`} method="POST" className="flex items-center gap-2">
                        <input
                          name="nominalCode"
                          defaultValue={c.nominal_code}
                          required
                          className="border border-line rounded px-2 py-1 text-sm font-mono w-24"
                        />
                        <input
                          name="description"
                          defaultValue={c.description}
                          required
                          className="border border-line rounded px-2 py-1 text-sm flex-1"
                        />
                        <input
                          name="taxReportingName"
                          placeholder="tax_reporting_name (if required)"
                          className="border border-line rounded px-2 py-1 text-sm w-56"
                        />
                        <button type="submit" className="bg-blue text-white text-xs font-medium px-3 py-1.5 rounded">
                          Save
                        </button>
                        <a href="/categories" className="text-xs text-slate-500 px-2">
                          Cancel
                        </a>
                      </form>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={c.url} className="border-b border-line/60">
                  <td className="p-2 font-mono">{c.nominal_code}</td>
                  <td className="p-2">{c.description}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-3">
                      <a href={`/categories?edit=${id}`} className="text-link underline text-xs">
                        Edit
                      </a>
                      <form action={`/api/categories/${id}/delete`} method="POST">
                        <input type="hidden" name="description" value={c.description} />
                        <button type="submit" className="text-red underline text-xs">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {categories.length === 0 ? (
              <tr>
                <td className="p-2 text-slate-400" colSpan={3}>
                  No bridging categories yet — add one below or create the preset set.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="mt-6 pt-4 border-t border-line">
          <h3 className="font-semibold text-sm mb-2">Add a category</h3>
          <form action="/api/categories/create" method="POST" className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="nominalCode">
                Nominal code
              </label>
              <input
                id="nominalCode"
                name="nominalCode"
                required
                className="border border-line rounded px-2 py-1.5 text-sm font-mono w-24"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" htmlFor="description">
                Description
              </label>
              <input
                id="description"
                name="description"
                required
                placeholder="bridging-..."
                className="border border-line rounded px-2 py-1.5 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="categoryGroup">
                Group
              </label>
              <select
                id="categoryGroup"
                name="categoryGroup"
                required
                className="border border-line rounded px-2 py-1.5 text-sm"
              >
                {EDITABLE_CATEGORY_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="taxReportingName">
                Tax reporting name
              </label>
              <input
                id="taxReportingName"
                name="taxReportingName"
                placeholder="required for most groups"
                className="border border-line rounded px-2 py-1.5 text-sm w-56"
              />
            </div>
            <button type="submit" className="bg-blue text-white text-sm font-medium px-4 py-1.5 rounded">
              Add
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
