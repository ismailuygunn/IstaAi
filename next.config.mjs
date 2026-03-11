/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for base64 image uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
