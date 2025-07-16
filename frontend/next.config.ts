/** @type {import('next').NextConfig} */
const nextConfig = {
  // If your FastAPI runs on a different port during development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*' // Proxy to FastAPI
      }
    ]
  }
}

module.exports = nextConfig