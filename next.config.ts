import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  output: "export",
  webpack: (config) => {
    // 添加环境变量替换
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.PR_TOKEN": JSON.stringify(process.env.PR_TOKEN),
      })
    );
    return config;
  },
  /* config options here */
};

export default nextConfig;
