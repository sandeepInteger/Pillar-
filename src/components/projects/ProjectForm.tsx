"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectFormData } from "@/types/database";
import { PROJECT_STATUS_LABELS } from "@/types/database";
import { createProject, updateProject } from "@/lib/actions/projects";

interface ProjectFormProps {
  initialData: ProjectFormData;
  projectId?: string;
}

export function ProjectForm({ initialData, projectId }: ProjectFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)] focus:ring-1 focus:ring-[var(--primary-light)]";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!form.name.trim()) {
      setError("Project name is required");
      setLoading(false);
      return;
    }

    const result = projectId
      ? await updateProject(projectId, form)
      : await createProject(form);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-white p-6 space-y-4">
        <div>
          <label className={labelClass}>Project Name *</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Client Name</label>
            <input
              className={inputClass}
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as ProjectFormData["status"],
                })
              }
            >
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {loading ? "Saving..." : projectId ? "Update Project" : "Create Project"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
