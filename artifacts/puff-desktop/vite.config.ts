import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { cpSync, existsSync } from 'node:fs';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

function copyScramjetAssets() {
  const projectRoot = path.resolve(import.meta.dirname);
  const publicDir = path.resolve(projectRoot, 'public');
  const scramDest = path.resolve(publicDir, 'scram');
  const bareDest = path.resolve(publicDir, 'baremux');

  let scramjetSrc: string | null = null;
  try {
    const { scramjetPath } = require('@mercuryworkshop/scramjet/path');
    scramjetSrc = scramjetPath;
  } catch {
    // scramjet not installed yet — skip silently
  }

  let bareMuxSrc: string | null = null;
  try {
    bareMuxSrc = require.resolve('@mercuryworkshop/bare-mux').replace(/dist\/index\.(js|cjs|mjs)$/, 'dist');
  } catch {
    // bare-mux not installed yet — skip silently
  }

  if (scramjetSrc && existsSync(scramjetSrc)) {
    cpSync(scramjetSrc, scramDest, { recursive: true, force: true });
  }
  if (bareMuxSrc && existsSync(bareMuxSrc)) {
    cpSync(bareMuxSrc, bareDest, { recursive: true, force: true });
  }
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    {
      name: 'copy-scramjet-assets',
      apply: 'build',
      buildStart() {
        copyScramjetAssets();
      },
    },
    {
      name: 'copy-scramjet-assets-dev',
      apply: 'serve',
      configureServer() {
        copyScramjetAssets();
      },
    },
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
