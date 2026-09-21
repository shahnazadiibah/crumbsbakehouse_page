"use client";

import { useState, useTransition } from "react";
import { updateAdminNotes } from "@/app/actions/admin-notes";

export default function AdminNotepad({
  noteId,
  path,
  initialContent,
}: {
  noteId: string;
  path: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    if (content === initialContent) return;
    startTransition(async () => {
      await updateAdminNotes(noteId, content, path);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-1.5 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Notes
        </p>
        {isPending && <span className="text-xs text-stone-400">Saving…</span>}
        {saved && !isPending && (
          <span className="text-xs text-green-700">Saved.</span>
        )}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={save}
        rows={4}
        placeholder="Jot down anything for yourself — e.g. supplier reminders, things to follow up on…"
        className="w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-500"
      />
    </div>
  );
}
