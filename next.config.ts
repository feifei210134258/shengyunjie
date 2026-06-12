import type { NextConfig } from "next";
import { LEGACY_BROWSER_POLYFILLS } from "./src/lib/browser/legacy-polyfills";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: LEGACY_BROWSER_POLYFILLS,
          entryOnly: false,
          raw: true,
          test: /\.js$/,
        })
      );
    }

    return config;
  },
};

export default nextConfig;
