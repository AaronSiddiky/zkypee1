/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Suppress specific warnings
  onWarning: (warning) => {
    if (warning.message.includes('Unsupported metadata viewport')) {
      return;
    }
    console.warn(warning);
  },
};

module.exports = nextConfig; 