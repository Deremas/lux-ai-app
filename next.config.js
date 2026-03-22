/** @type {import('next').NextConfig} */
const nextConfig = {
  // If you later enable output: "export", note:
  // serverExternalPackages is server-only and won't matter for static export.
  // output: "export",

  // serverExternalPackages: ["pdf-parse"],
  outputFileTracing: false,
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  webpack: (config) => {
    if (config.cache !== false) {
      // Avoid large filesystem cache writes when the local disk is nearly full.
      config.cache = false;
    }

    return config;
  },
};

module.exports = nextConfig;
