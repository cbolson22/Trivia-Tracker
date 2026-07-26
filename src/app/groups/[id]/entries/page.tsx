import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntryFeed } from "./EntryFeed";

export type Entry = {
  id: string;
  group_id: string;
  author_id: string;
  question: string;
  answer: string;
  category: string | null;
  source: string | null;
  heard_on: string | null;
  created_at: string;
};

export default async function EntriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, allow_member_edits")
    .eq("id", id)
    .single();

  if (!group) notFound();

  const { data: entries } = await supabase
    .from("entries")
    .select(
      "id, group_id, author_id, question, answer, category, source, heard_on, created_at"
    )
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          {group.name}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">Trivia feed</p>

        <EntryFeed
          groupId={id}
          currentUserId={user.id}
          allowMemberEdits={group.allow_member_edits as boolean}
          entries={(entries ?? []) as Entry[]}
        />

        <p className="mt-8 text-center text-sm text-gray-600">
          <Link href={`/groups/${id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to group
          </Link>
        </p>
      </div>
    </main>
  );
}
