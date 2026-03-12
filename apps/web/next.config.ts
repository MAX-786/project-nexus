import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gzip/Brotli compress HTTP responses
  compress: true,

  // Remove the X-Powered-By header for a leaner response
  poweredByHeader: false,

  // Optimize well-known packages: tree-shake to only the icons/components
  // actually used instead of shipping the entire library.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@xyflow/react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tooltip",
    ],
  },

  // Serve modern image formats when supported by the browser
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
