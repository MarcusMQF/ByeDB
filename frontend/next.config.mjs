const nextConfig = {
  assetPrefix: "/exp2-static",
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],    
  },
  // Disable all development indicators and overlays
  devIndicators: {
    position: 'bottom-left',
  },
  // Disable development overlay completely
  experimental: {
    disableOptimizedLoading: true,
  },
}

export default nextConfig
