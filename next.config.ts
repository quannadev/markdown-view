import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "fs/promises": false,
        path: false,
        worker_threads: false,
        child_process: false,
        os: false,
        url: false,
        module: false,
      };

      // Handle node: schemes
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
      
      // Map them to false
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(node:)?(fs|path|os|worker_threads|child_process|module|url)$/,
        })
      );
    }
    return config;
  },
};

export default nextConfig;
