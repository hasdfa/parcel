import Parcel from '@parcel/core';
import { REPLOptions, FileSystem } from '../../types'
import { ExtendedWorkerFarm } from '../fs/fs-worker-farm'
import { BrowserPackageManager } from '../npm/browser-package-resolver';
import configRepl from './parcelrc.json'
import PathUtils from '../path-utils';

export async function setupParcelBundler(
  fs: FileSystem,
  workerFarm: ExtendedWorkerFarm,
  options: REPLOptions,
) {
  if (!(await fs.exists('/.parcelrc'))) {
    await fs.writeFile(
      '/.parcelrc',
      JSON.stringify(configRepl, null, 2),
      undefined,
    );
  }

  // TODO for NodeResolver
  if (!(await fs.exists('/_empty.js'))) {
    await fs.writeFile('/_empty.js', '', undefined);
  }

  const bundler = new Parcel({
    entries: options.entries,
    // https://github.com/parcel-bundler/parcel/pull/4290
    shouldDisableCache: false,
    cacheDir: PathUtils.CACHE_DIR,
    mode: options.mode,
    env: {
      NODE_ENV: options.mode,
    },
    hmrOptions: options.hmr ? {} : null,
    logLevel: 'verbose',
    shouldPatchConsole: false,
    workerFarm,
    defaultConfig: '/.parcelrc',
    inputFS: fs,
    outputFS: fs,
    defaultTargetOptions: {
      distDir: PathUtils.DIST_DIR,
      publicUrl: options.publicUrl || undefined,
      shouldOptimize: options.minify,
      shouldScopeHoist: options.scopeHoist,
      sourceMaps: options.sourceMaps,
    },
    packageManager: new BrowserPackageManager(fs, '/'),
  });

  return { bundler };
}
