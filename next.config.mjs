import withPWA from "next-pwa";

const withPwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Our push notification handler lives in worker/index.js and gets
  // bundled into the generated service worker automatically.
  customWorkerDir: "worker",
  fallbacks: {
    document: "/offline.html",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPwa(nextConfig);
