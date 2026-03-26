const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => ({
  // If you later enable output: "export", note:
  // serverExternalPackages is server-only and won't matter for static export.
  // output: "export",
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  experimental: {
    webpackBuildWorker: true,
  },
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
});
