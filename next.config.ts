import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessario per usare ffmpeg e ytdl-core nelle API routes (Node.js runtime)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Evita che webpack tenti di bundlare moduli nativi Node.js
      const externals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [
        ...externals,
        "fluent-ffmpeg",
        "@ffmpeg-installer/ffmpeg",
        "ytdl-core",
      ];
    }
    return config;
  },
};

export default nextConfig;
