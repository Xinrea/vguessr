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
        "process.env.NEXT_PUBLIC_SOCKET_URL": JSON.stringify(
          process.env.NEXT_PUBLIC_SOCKET_URL
        ),
      })
    );
    return config;
  },
  /* config options here */
};

export default nextConfig;
