/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Optional: Change the output directory from 'out' to 'dist'
  // distDir: 'dist',
}

module.exports = nextConfig


