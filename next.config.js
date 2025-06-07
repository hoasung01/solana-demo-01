/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "buffer": require.resolve("buffer/"),
    };
    return config;
  },
  turbopack: {
    rules: {
      '*.css': ['postcss'],
    },
  },
};

module.exports = nextConfig;
