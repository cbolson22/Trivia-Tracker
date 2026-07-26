"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function NewEntryForm() {
  const router = useRouter();
  const { id: groupId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const venueId = searchParams.get("venue_id");

  const [venueName, setVenueName] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [heardOn, setHeardOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    const supabase = createClient();
    supabase
      .from("venues")
      .select("name")
      .eq("id", venueId)
      .single()
      .then(({ data }) => setVenueName((data as { name: string } | null)?.name ?? null));
  }, [venueId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("entries").insert({
      group_id: groupId,
      question,
      answer,
      category: category || null,
      source: source || null,
      heard_on: heardOn || null,
      venue_id: venueId || null,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(`/groups/${groupId}/entries`);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
        Add an entry
      </h1>
      {venueName && (
        <p className="mb-6 text-center text-sm text-gray-500">
          Logging for: <span className="font-medium text-gray-700">{venueName}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
            Question
          </label>
          <textarea
            id="question"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
            Answer
          </label>
          <textarea
            id="answer"
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category (optional)
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Source (optional)
          </label>
          <input
            id="source"
            type="text"
            placeholder="e.g. Tuesday quiz at The Anchor"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="heardOn" className="block text-sm font-medium text-gray-700 mb-1">
            Date heard (optional)
          </label>
          <input
            id="heardOn"
            type="date"
            value={heardOn}
            onChange={(e) => setHeardOn(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving…" : "Save entry"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link
          href={`/groups/${groupId}/entries`}
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to feed
        </Link>
      </p>
    </div>
  );
}

export default function NewEntryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={null}>
        <NewEntryForm />
      </Suspense>
    </main>
  );
}
