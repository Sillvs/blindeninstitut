import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * CSP is restrictive: no inline scripts allowed except those Next.js itself
 * needs (which it already nonces). We allow `data:` images so jsPDF/html2canvas
 * embedded images render in the preview.
 */
const securityHeaders = [
  // Block MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking — this tool is never meant to be iframed
  { key: "X-Frame-Options", value: "DENY" },
  // Don't leak the URL when navigating away
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 2 years incl. subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Disable browser features we never use
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  },
  // Content Security Policy
  // - default-src 'self': only same-origin resources
  // - img-src 'self' data: blob: — needed for inline images in PDF preview
  // - script-src: 'unsafe-inline' is unavoidable today because Next.js inlines
  //   __NEXT_DATA__ + hydration runtime without nonces in default config.
  //   'unsafe-eval' has been removed — production Next.js does NOT need it
  //   (HMR only uses it in dev, which runs via `next dev` not this prod CSP).
  // - style-src 'unsafe-inline' for Tailwind / inline style attributes
  // - connect-src 'self': API calls only to this origin
  // - object-src 'none': block <object>/<embed>/<applet>
  // - base-uri 'self': lock <base href>
  // - form-action 'self': forms can't post to other origins
  // - frame-ancestors 'none': belt-and-suspenders for X-Frame-Options
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
