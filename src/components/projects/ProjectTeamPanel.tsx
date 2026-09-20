"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Employee, Project, ProjectAssignmentWithEmployee } from "@/types/database";
import {
  EMPLOYEE_TYPE_LABELS,
  EMPLOYEE_TYPE_COLORS,
  MULTI_PROJECT_TYPES,
} from "@/types/database";
import {
  assignEmployeeToProject,
  removeEmployeeFromProject,
  transferEmployeeToProject,
} from "@/lib/actions/projects";
import {
  compareEmployeesByHierarchy,
  sortEmployeesByHierarchy,
} from "@/lib/utils/employees";
import { ArrowRightLeft, UserMinus, UserPlus } from "lucide-react";

interface ProjectTeamPanelProps {
  projectId: string;
  assignments: ProjectAssignmentWithEmployee[];
  availableEmployees: Employee[];
  otherProjects: Project[];
}

export function ProjectTeamPanel({
  projectId,
  assignments,
  availableEmployees,
  otherProjects,
}: ProjectTeamPanelProps) {
  const router = useRouter();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [transferEmployee, setTransferEmployee] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAssign() {
    if (!selectedEmployee) return;
    setLoading(true);
    setMessage(null);
    const result = await assignEmployeeToProject(projectId, selectedEmployee);
    if (result.error) setMessage(result.error);
    else {
      setSelectedEmployee("");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleRemove(employeeId: string) {
    setLoading(true);
    await removeEmployeeFromProject(projectId, employeeId);
    router.refresh();
    setLoading(false);
  }

  async function handleTransfer() {
    if (!transferEmployee || !transferTarget) return;
    setLoading(true);
    setMessage(null);
    const result = await transferEmployeeToProject(
      transferEmployee,
      projectId,
      transferTarget
    );
    if (result.error) setMessage(result.error);
    else {
      setTransferEmployee("");
      setTransferTarget("");
      router.refresh();
    }
    setLoading(false);
  }

  const transferOptions = otherProjects.filter((p) => p.id !== projectId);

  const sortedAvailable = useMemo(
    () => sortEmployeesByHierarchy(availableEmployees),
    [availableEmployees]
  );

  const sortedAssignments = useMemo(
    () =>
      [...assignments].sort((a, b) =>
        compareEmployeesByHierarchy(a.employees, b.employees)
      ),
    [assignments]
  );

  const siteWorkersOnProject = useMemo(
    () =>
      sortedAssignments.filter(
        (a) => !MULTI_PROJECT_TYPES.includes(a.employees.employee_type)
      ),
    [sortedAssignments]
  );

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {/* Assign */}
      <div className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h3 className="mb-1 font-semibold">Add to project</h3>
        <p className="mb-4 text-xs text-[var(--muted)]">
          Engineers can work on multiple projects. Labour & foreman are on one
          site at a time — use Transfer to move them.
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">Select employee...</option>
            {sortedAvailable.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} ({EMPLOYEE_TYPE_LABELS[emp.employee_type]})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading || !selectedEmployee}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            Assign
          </button>
        </div>
      </div>

      {/* Transfer labour */}
      {transferOptions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-1 font-semibold text-amber-900">
            Transfer to another project
          </h3>
          <p className="mb-4 text-xs text-amber-800">
            Move labour or foreman from this site to another (ends here, starts
            there).
          </p>
          <div className="flex flex-wrap gap-2">
            <select
              value={transferEmployee}
              onChange={(e) => setTransferEmployee(e.target.value)}
              className="rounded-lg border border-amber-200 px-3 py-2 text-sm"
            >
              <option value="">Employee on this project...</option>
              {siteWorkersOnProject.map((a) => (
                  <option key={a.employee_id} value={a.employee_id}>
                    {a.employees.full_name}
                  </option>
                ))}
            </select>
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="rounded-lg border border-amber-200 px-3 py-2 text-sm"
            >
              <option value="">Move to project...</option>
              {transferOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleTransfer}
              disabled={loading || !transferEmployee || !transferTarget}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer
            </button>
          </div>
        </div>
      )}

      {/* Team list */}
      <div className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h3 className="mb-4 font-semibold">
          Team on site ({sortedAssignments.length})
        </h3>
        {sortedAssignments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No one assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {sortedAssignments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{a.employees.full_name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span
                      className={`rounded px-1.5 py-0.5 ${EMPLOYEE_TYPE_COLORS[a.employees.employee_type]}`}
                    >
                      {EMPLOYEE_TYPE_LABELS[a.employees.employee_type]}
                    </span>
                    {MULTI_PROJECT_TYPES.includes(
                      a.employees.employee_type
                    ) && (
                      <span className="text-[var(--primary)]">Shared · multi-project</span>
                    )}
                    <span className="text-[var(--muted)]">
                      Since {a.started_at}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(a.employee_id)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
