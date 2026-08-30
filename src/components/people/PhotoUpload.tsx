"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { uploadEmployeePhoto } from "@/lib/actions/employees";

export function PhotoUpload({
  employeeId,
  currentUrl,
  name,
}: {
  employeeId: string;
  currentUrl: string | null;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(currentUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("employeeId", employeeId);
    formData.append("photo", file);

    const result = await uploadEmployeePhoto(formData);
    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setUrl(result.url);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-md">
        {url ? (
          <Image src={url} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
      >
        <Camera className="h-4 w-4" />
        {loading ? "Uploading..." : "Upload Photo"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
