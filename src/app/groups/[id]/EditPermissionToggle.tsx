"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EditPermissionToggle({
  groupId,
  initialValue,
}: {
  groupId: string;
  initialValue: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    const next = !value;
    const { error } = await supabase
      .from("groups")
      .update({ allow_member_edits: next })
      .eq("id", groupId);

    if (!error) {
      setValue(next);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
    >
      <span className="block text-sm font-medium text-gray-700">
        Allow members to edit/delete each other&apos;s entries
      </span>
      <span className="mt-1 block text-sm text-gray-500">
        {value ? "Enabled" : "Disabled"} — tap to {value ? "disable" : "enable"}
      </span>
    </button>
  );
}
