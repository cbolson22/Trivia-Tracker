"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Entry } from "./page";

export function EntryFeed({
  groupId,
  currentUserId,
  allowMemberEdits,
  entries,
}: {
  groupId: string;
  currentUserId: string;
  allowMemberEdits: boolean;
  entries: Entry[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const categories = useMemo(
    () =>
      Array.from(
        new Set(entries.map((entry) => entry.category).filter((c): c is string => !!c))
      ),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesSearch =
        query.length === 0 ||
        entry.question.toLowerCase().includes(query) ||
        entry.answer.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [entries, search, categoryFilter]);

  function toggleRevealed(entryId: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }

  async function handleDelete(entryId: string) {
    if (!window.confirm("Delete this entry?")) return;

    const supabase = createClient();
    await supabase.from("entries").delete().eq("id", entryId);
    router.refresh();
  }

  return (
    <div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search questions and answers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        )}
      </div>

      <Link
        href={`/groups/${groupId}/entries/new`}
        className="mt-4 block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-indigo-700"
      >
        Add entry
      </Link>

      <ul className="mt-6 space-y-3">
        {filteredEntries.length === 0 && (
          <p className="text-center text-sm text-gray-500">No entries yet.</p>
        )}

        {filteredEntries.map((entry) => {
          const revealed = revealedIds.has(entry.id);
          const canEdit = entry.author_id === currentUserId || allowMemberEdits;

          return (
            <li key={entry.id} className="rounded-lg border border-gray-300 bg-white px-4 py-3">
              <p className="font-medium text-gray-900">{entry.question}</p>

              <button
                type="button"
                onClick={() => toggleRevealed(entry.id)}
                className="mt-2 block w-full text-left"
              >
                <span
                  className={
                    revealed
                      ? "text-gray-700"
                      : "select-none text-gray-700 blur-sm"
                  }
                >
                  {entry.answer}
                </span>
                {!revealed && (
                  <span className="mt-1 block text-xs font-medium text-indigo-600">
                    Tap to reveal
                  </span>
                )}
              </button>

              {entry.category && (
                <p className="mt-2 text-xs text-gray-500">{entry.category}</p>
              )}

              {canEdit && (
                <div className="mt-3 flex gap-3 text-sm">
                  <Link
                    href={`/groups/${groupId}/entries/${entry.id}/edit`}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="font-medium text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
