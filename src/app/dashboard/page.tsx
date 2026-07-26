import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-gray-900">Trivia Tracker</h1>
      <p className="mt-2 text-sm text-gray-500">{user.email}</p>

      <Link
        href="/groups"
        className="mt-8 w-full max-w-xs rounded-lg bg-indigo-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-indigo-700"
      >
        Your groups
      </Link>

      <form action="/auth/signout" method="post" className="mt-4 w-full max-w-xs">
        <button
          type="submit"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
