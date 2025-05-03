import type { NextConfig } from "next";
import path from 'path';
import fs from 'fs';

const ASSETS_PREFIX = 'public';

function makeTry<T>(fn: () => T, fallback: () => T) {
  try {
    return fn();
  } catch {
    return fallback();
  }
}

const tryUnlink = (filePath: string) => {
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* Ignore */
  }
};

const nextConfig: NextConfig = {
  webpack: (config) => {
    console.log('webpack')

    // Handle .wasm files
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Handle
    config.module.rules.push({
      test: /\?url$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]',
            outputPath: 'static/assets/',
            publicPath: '/_next/static/assets/',
          },
        },
      ],
    });

    // Copy service worker and worker files from @vraksha/parcel-browser to public directory
    if (!config.isServer) {
      const esbuildWorker = path.dirname(require.resolve('@vraksha/esbuild-browser/worker'));
      fs.cpSync(esbuildWorker, path.join(process.cwd(), `${ASSETS_PREFIX}/esbuild-browser/`), { recursive: true });

      // PRODUCTION:
      // const parcelReplRoot = path.dirname(require.resolve('@vraksha/parcel-browser/package.json'));
      // const swSource = require.resolve('@vraksha/parcel-browser/sw');
      // const workerSourceDir = path.dirname(require.resolve('@vraksha/parcel-browser/worker'));

      // STAGING:
      const parcelReplRoot = path.resolve(__dirname, '..'); // <-- Only for demo
      const swSource = `${parcelReplRoot}/dist/@service-worker/index.js`;
      const workerSourceDir = `${parcelReplRoot}/dist/@worker/`;
      const packageJson = JSON.parse(fs.readFileSync(`${parcelReplRoot}/package.json`, 'utf8'));
      const version = packageJson.version;

      // Copy service worker file from package to public directory
      const swDest = path.join(process.cwd(), `${ASSETS_PREFIX}/parcel-web-bundler-sw.js`);
      // Find all files public/repl-sw-... and remove them
      makeTry(
        () => fs.readdirSync(path.join(process.cwd(), ASSETS_PREFIX)),
        () => [],
      )
        .filter((file) => file.startsWith('parcel-web-bundler-sw'))
        .forEach((file) => {
          tryUnlink(path.join(process.cwd(), ASSETS_PREFIX, file));
        });

      fs.mkdirSync(path.dirname(swDest), { recursive: true });
      fs.copyFileSync(swSource, swDest);

      // // Copy worker file from package to public directory
      const workerDestDir = path.join(process.cwd(), `${ASSETS_PREFIX}/parcel-web-bundler-worker/`);
      tryUnlink(workerDestDir);
      fs.mkdirSync(workerDestDir, { recursive: true });
      fs.cpSync(workerSourceDir, workerDestDir, { recursive: true });
    }


    return config;
  },
};

export default nextConfig;
