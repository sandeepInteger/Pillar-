"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { syncAllToGoogleSheet } from "@/lib/actions/employees";

export function SyncToSheetsButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);

    const result = await syncAllToGoogleSheet();

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(`Synced ${result.count} employees to Google Sheet`);
    }

    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing..." : "Sync to Google Sheet"}
      </button>
      {message && (
        <span
          className={`text-sm ${message.startsWith("Synced") ? "text-[var(--primary)]" : "text-red-600"}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
