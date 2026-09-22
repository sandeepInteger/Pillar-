import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // pdfkit (used by @react-pdf/renderer for the attendance PDF) loads its
  // standard font files via a dynamic subpath import that Next's output
  // file tracing can't follow, so they get dropped from the serverless
  // bundle unless explicitly included here.
  outputFileTracingIncludes: {
    "/api/attendance/export/[employeeId]": [
      "./node_modules/pdfkit/js/**/*",
      "./node_modules/@react-pdf/**/*",
    ],
  },
};

export default nextConfig;
