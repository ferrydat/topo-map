/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add basePath for GitHub Pages deployment
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Output static files for GitHub Pages
  output: 'export',
  
  // Disable TypeScript errors during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint errors during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
