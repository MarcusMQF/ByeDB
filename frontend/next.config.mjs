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
    buildActivity: false,
    buildActivityPosition: 'bottom-right'
  },
  // Disable development overlay completely
  experimental: {
    disableOptimizedLoading: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
