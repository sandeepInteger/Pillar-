"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteEmployee } from "@/lib/actions/employees";

export function DeleteEmployeeButton({
  employeeId,
  name,
}: {
  employeeId: string;
  name: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteEmployee(employeeId);
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
      <span className="text-sm text-red-700">Delete {name}?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="text-sm font-semibold text-red-700 underline disabled:opacity-60"
      >
        {loading ? "Deleting..." : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-gray-600"
      >
        Cancel
      </button>
    </div>
  );
}
