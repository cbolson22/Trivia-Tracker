import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditEntryForm } from "./EditEntryForm";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  const { id: groupId, entryId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("id, allow_member_edits")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const { data: entry } = await supabase
    .from("entries")
    .select("id, group_id, author_id, question, answer, category, source, heard_on, created_at")
    .eq("id", entryId)
    .single();

  if (!entry) notFound();

  // UX-only check: the real enforcement is entries_update_author_or_permitted
  // and entries_delete_author_or_permitted in Postgres, which reject the
  // write regardless of what this page renders.
  const canEdit = entry.author_id === user.id || group.allow_member_edits;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
          {canEdit ? "Edit entry" : "Entry"}
        </h1>

        {canEdit ? (
          <EditEntryForm entry={entry} groupId={groupId} />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Question</p>
              <p className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900">
                {entry.question}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Answer</p>
              <p className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900">
                {entry.answer}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Only the person who added this entry can edit it.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link
            href={`/groups/${groupId}/entries`}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to feed
          </Link>
        </p>
      </div>
    </main>
  );
}
