import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.179.152"],
  serverExternalPackages: ["sharp", "@imgly/background-removal-node", "onnxruntime-node", "undici"],
};

export default nextConfig;
