/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "buffer": require.resolve("buffer/"),
    };
    return config;
  },
  experimental: {
    turbo: {
      rules: {
        // Configure Turbopack rules
        '*.css': ['postcss'],
      },
    },
  },
};

module.exports = nextConfig;
