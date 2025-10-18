"use client";

import { useMemo } from "react";
import { useFilterStore } from "@/app/lib/collection/filters";

export default function FilterDropdown() {
  const {
    open,
    filters,
    setFilters,
    patchFilters,
    clearFilters,
    availableNames,
  } = useFilterStore();


  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.names.length > 0) n++;
    if (filters.acquiredFrom || filters.acquiredTo) n++;
    return n;
  }, [filters]);
  if (!open) return null;

  return (
    <div
      className="absolute top-22 right-0 w-72 rounded-2xl bg-white shadow-2xl border border-gray-200 p-4 text-gray-800"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Filters {activeCount > 0 ? <span className="text-gray-400">({activeCount})</span> : null}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="text-xs cursor-pointer px-2 py-1 rounded-lg border hover:bg-gray-50 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Names */}
      <section className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-gray-500">Names</div>
        <div className="max-h-40 overflow-auto rounded-xl border p-2">
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={filters.names.length === 0}
              onChange={(e) => {
                if (e.target.checked) setFilters({ ...filters, names: [] });
              }}
            />
            <span className="text-sm">All</span>
          </label>

          {availableNames.map((name) => {
            const checked = filters.names.length > 0 && filters.names.includes(name);
            return (
              <label
                key={name}
                className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = new Set(filters.names);
                    if (e.target.checked) next.add(name);
                    else next.delete(name);
                    // empty => treat as All
                    setFilters({ ...filters, names: Array.from(next) });
                  }}
                />
                <span className="text-sm">{name}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Date acquired */}
      <section className="mt-4 space-y-2">
        <div className="text-xs uppercase tracking-wide text-gray-500">Date acquired</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            className="rounded-xl border px-3 py-2"
            value={filters.acquiredFrom ?? ""}
            onChange={(e) => patchFilters({ acquiredFrom: e.target.value || null })}
          />
          <input
            type="date"
            className="rounded-xl border px-3 py-2"
            value={filters.acquiredTo ?? ""}
            onChange={(e) => patchFilters({ acquiredTo: e.target.value || null })}
          />
        </div>
      </section>
    </div>
  )
}