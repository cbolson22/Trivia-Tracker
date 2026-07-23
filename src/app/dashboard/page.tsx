import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold text-gray-900">Welcome to Trivia Tracker</h1>
      <p className="mt-2 text-sm text-gray-500">{user.email}</p>
      <form action="/auth/signout" method="post" className="mt-8">
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
