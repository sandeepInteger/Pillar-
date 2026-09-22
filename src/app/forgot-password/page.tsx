import Link from "next/link";
import { Layers } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-none absolute inset-0 bg-[var(--background)]" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />

      <div className="relative w-full max-w-md px-1">
        <div className="pillar-card p-6 shadow-lg sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl pillar-gradient-bar shadow-md">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Forgot password
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              We&apos;ll email you a link to reset it
            </p>
          </div>
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            <Link
              href="/login"
              className="font-medium text-[var(--primary)] hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
