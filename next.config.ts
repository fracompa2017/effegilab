import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://effegi-lab.it";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.cloudinary.com",
  "frame-src 'self' https://js.stripe.com https://www.google.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    const targetHost = new URL(siteUrl).host;

    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${targetHost.replace(/^www\./, "")}` }],
        destination: `${siteUrl}/:path*`,
        permanent: true,
      },
    ];
  },
};

type ConfigTransformer = (config: NextConfig) => NextConfig;

const withBundleAnalyzer: ConfigTransformer = (() => {
  if (process.env.NODE_ENV !== "development") {
    return (config) => config;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@next/bundle-analyzer")({
      enabled: process.env.ANALYZE === "true",
    }) as ConfigTransformer;
  } catch {
    return (config) => config;
  }
})();

export default withBundleAnalyzer(nextConfig);
