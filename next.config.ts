import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 通讯录全部按请求实时读写 MySQL，关闭 Cache Components 以免 cookies()/searchParams
  // 触发 Suspense 边界要求
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
