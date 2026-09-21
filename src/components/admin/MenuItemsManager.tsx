"use client";

import { useState } from "react";
import { updateMenuItemDetails } from "@/app/actions/admin-menu-items";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  size_label: string | null;
  allergens: string | null;
  image_url: string | null;
}

const fieldInputClass =
  "w-full rounded-lg border border-stone-300 p-2 text-sm text-stone-900";

export default function MenuItemsManager({ items }: { items: MenuItem[] }) {
  const [drafts, setDrafts] = useState<Record<string, MenuItem>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i]))
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  function setField(id: string, field: keyof MenuItem, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  async function save(id: string) {
    const draft = drafts[id];
    setPendingId(id);
    await updateMenuItemDetails(id, {
      name: draft.name,
      description: draft.description ?? "",
      sizeLabel: draft.size_label ?? "",
      allergens: draft.allergens ?? "",
      imageUrl: draft.image_url ?? "",
    });
    setPendingId(null);
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const draft = drafts[item.id] ?? item;
        const disabled = pendingId === item.id;
        return (
          <div
            key={item.id}
            className="grid gap-2 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Name
              </label>
              <input
                value={draft.name}
                disabled={disabled}
                onChange={(e) => setField(item.id, "name", e.target.value)}
                onBlur={() => save(item.id)}
                className={fieldInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Size / format (e.g. &quot;⌀ 16cm&quot;, &quot;↔ 27cm&quot;)
              </label>
              <input
                value={draft.size_label ?? ""}
                disabled={disabled}
                placeholder="Leave blank if not applicable"
                onChange={(e) =>
                  setField(item.id, "size_label", e.target.value)
                }
                onBlur={() => save(item.id)}
                className={fieldInputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Description
              </label>
              <textarea
                value={draft.description ?? ""}
                disabled={disabled}
                rows={2}
                onChange={(e) =>
                  setField(item.id, "description", e.target.value)
                }
                onBlur={() => save(item.id)}
                className={fieldInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Allergens (comma-separated)
              </label>
              <input
                value={draft.allergens ?? ""}
                disabled={disabled}
                placeholder="egg, dairy, wheat"
                onChange={(e) =>
                  setField(item.id, "allergens", e.target.value)
                }
                onBlur={() => save(item.id)}
                className={fieldInputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Photo URL
              </label>
              <input
                value={draft.image_url ?? ""}
                disabled={disabled}
                placeholder="https://…"
                onChange={(e) =>
                  setField(item.id, "image_url", e.target.value)
                }
                onBlur={() => save(item.id)}
                className={fieldInputClass}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
