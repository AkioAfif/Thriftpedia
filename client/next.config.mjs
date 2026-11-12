const API_URL = process.env.API_URL || 'http://localhost:5000/api';

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: 'D:/PAW PROJECT/client',
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/:path*` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
};

export default nextConfig;