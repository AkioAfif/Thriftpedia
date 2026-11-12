const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_URL}/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
  images: {
    // Keep in sync with src/lib/imageHosts.js (decides when next/image may optimise a URL).
    remotePatterns: [
      // Product photos (uploaded to Cloudinary by the API).
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
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
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/uploads/**' },/*  */
    ],
  },
};

export default nextConfig;