import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type GroupMember = {
  user_id: string;
  email: string;
  role: string;
  joined_at: string;
};

export default async function GroupDetailPage({
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
    .select("id, name, invite_code")
    .eq("id", id)
    .single();

  if (!group) notFound();

  const { data: members } = await supabase.rpc("list_group_members", {
    p_group_id: id,
  });

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          {group.name}
        </h1>

        <div className="mt-6 rounded-lg border border-gray-300 bg-white px-4 py-3 text-center">
          <p className="text-sm text-gray-500">Invite code</p>
          <p className="mt-1 font-mono text-xl tracking-widest text-gray-900">
            {group.invite_code}
          </p>
        </div>

        <h2 className="mt-8 text-sm font-medium text-gray-700">Members</h2>
        <ul className="mt-2 space-y-2">
          {((members ?? []) as GroupMember[]).map((member) => (
            <li
              key={member.user_id}
              className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3"
            >
              <span className="text-gray-900">
                {member.user_id === user.id ? "You" : member.email}
              </span>
              <span className="text-sm text-gray-500">{member.role}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-gray-600">
          <Link href="/groups" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to your groups
          </Link>
        </p>
      </div>
    </main>
  );
}
