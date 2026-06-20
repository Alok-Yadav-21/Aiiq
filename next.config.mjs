/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  // pdf-parse/pdfjs-dist resolve their worker file relative to node_modules at
  // runtime — bundling them breaks that ("Cannot find pdf.worker.mjs"). Keep them
  // external so Node loads them directly. jszip is left bundled (pure JS, no worker).
  serverExternalPackages: ['pino', 'pino-pretty', 'bcryptjs', 'mammoth', 'sharp', 'pdf-parse', 'pdfjs-dist'],
}

export default nextConfig
