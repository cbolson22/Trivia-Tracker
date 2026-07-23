import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("memberships")
    .select("group_id, role")
    .eq("user_id", user.id);

  const groupIds = (memberships ?? []).map((m) => m.group_id);

  const { data: groups } = groupIds.length
    ? await supabase.from("groups").select("id, name, invite_code").in("id", groupIds)
    : { data: [] };

  const roleByGroupId = new Map((memberships ?? []).map((m) => [m.group_id, m.role]));

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Your groups
        </h1>

        {groups && groups.length > 0 ? (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="block rounded-lg border border-gray-300 bg-white px-4 py-3 hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">{group.name}</p>
                  <p className="text-sm text-gray-500">
                    {roleByGroupId.get(group.id) === "owner" ? "Owner" : "Member"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-gray-500">
            You&apos;re not in any groups yet.
          </p>
        )}

        <div className="mt-8 space-y-3">
          <Link
            href="/groups/new"
            className="block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-indigo-700"
          >
            Create a group
          </Link>
          <Link
            href="/groups/join"
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            Join a group
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          <Link href="/dashboard" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
