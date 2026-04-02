import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Use worker threads for build-time tasks to avoid host-level process spawn limits.
    workerThreads: true,
  },
};

export default nextConfig;
