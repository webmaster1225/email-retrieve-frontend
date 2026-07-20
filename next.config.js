/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  webpack: (config, { dev }) => {
    // On Windows, webpack's persistent filesystem cache intermittently fails to
    // rename its *.pack.gz temp files (EBUSY: resource busy or locked) when a
    // lock holder (antivirus, search indexer, OneDrive, or a stray dev server)
    // touches .next/cache. That can leave a corrupt cache and serve broken JS
    // chunks after a hard navigation (e.g. the OAuth redirect). Use an in-memory
    // cache in dev to avoid the on-disk rename entirely.
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

module.exports = nextConfig;
