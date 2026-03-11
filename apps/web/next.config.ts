import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    // Workspace installs place `next` in the monorepo root node_modules on CI.
    root: path.join(__dirname, '..', '..'),
  },
};

export default nextConfig;
