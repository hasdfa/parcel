import '@rolldown/binding-wasm32-wasi';

import path from 'path';
import * as comlink from 'comlink';
import { FileSystemManager } from '../file-system-manager';
import { NPMInstaller, NPMSpawnOptions } from './dependencies-installer';
import { virtualResolvePath } from '../esbuild/plugins/memfs-plugin';

const fs = new FileSystemManager();

export interface BundleOptions {
  input: string;
}

async function rolldown__bundle(options: BundleOptions) {
  // process.env.NAPI_RS_FORCE_WASI = '1';
  // const { rolldown } = await import('rolldown');

  // const startTime = Date.now();
  // // 1. create a bundler instance (same API as Rollup)
  // const bundler = await rolldown({
  //   input: options.input,
  //   plugins: [
  //     {
  //       name: "memfs-plugin",
  //       resolveId(importee, importer) {
  //         const resolved = virtualResolvePath(fs, importee, importer || '');
  //         console.debug("resolveId", { importee, importer, resolved });
  //         return resolved || null;
  //       },
  //       load(id) {
  //         console.debug("load", { id });
  //         return fs.readFile(id);
  //       },
  //     },
  //   ],
  // });

  // // 2. generate an ESM bundle in memory
  // const { output } = await bundler.generate({
  //   format: 'esm',
  //   sourcemap: 'inline',
  // });

  // // 3. destroy the instance & hand the code back
  // await bundler.close();

  // console.log('Build finished in', Math.round((Date.now() - startTime) / 100) / 10, 's');
  // console.log('build', output);

  return {};
}

async function npm__install(options: NPMSpawnOptions) {
  console.log('npm__install', options);
  await NPMInstaller.install(fs, options).catch((error) => {
    console.error('npm__install', error);
    console.log('fs_dump', JSON.stringify(Object.fromEntries(Object.entries(fs.files).map(([key, value]) => [key, value.contents.slice(0, 100)])), null, 2));
  });
}

const worker = {
  ...fs.toSerializable(),
  rolldown__bundle,
  npm__install,
};

export type Worker = typeof worker;

console.log('comlink.expose', worker);
comlink.expose(worker);
