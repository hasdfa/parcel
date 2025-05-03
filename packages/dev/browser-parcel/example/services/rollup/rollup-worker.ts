import * as comlink from 'comlink';
import * as rollup from '@rollup/browser'
import { FileSystemManager } from '../file-system-manager';
import { NPMInstaller, NPMSpawnOptions } from './dependencies-installer';
import rollupPluginEsbuild from './plugins/rollup-plugin-esbuild';
import esbuild from 'esbuild-wasm';
import path from 'path';

const fs = new FileSystemManager();

export interface BundleOptions {
  input: string;
}

const esbuildWasmPromise = esbuild.initialize({
  // wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.3/esbuild.wasm',
  wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.25.3/esbuild.wasm',
  worker: true, // run the WASM in current worker thread
})

async function rollup__bundle(options: BundleOptions) {
  await esbuildWasmPromise;

  const startTime = Date.now();
  const bundle = await rollup.rollup({
    input: options.input,
    plugins: [
      rollupPluginEsbuild({
        fs,
      }),
      {
        name: "rollup-memfs-plugin",
        resolveId(importee, importer) {
          console.debug("resolveId", { importee, importer });
          const resolved = path.resolve(fs.cwd(), importee);
          return resolved;
        },
        load(id) {
          console.debug("load", { id });
          return fs.readFile(id);
        },
      },
    ],

  });

  const build = (await bundle.generate({})).output[0];

  console.log('Build finished in', Math.round((Date.now() - startTime) / 100) / 10, 's');
  console.log('build', build);

  // build.outputFiles?.forEach((file) => {
  //   // file.path = file.path.replace(/^\//, '');
  //   file.path = file.path.slice('/dist/'.length);
  // });

  // const resolvedEntries = Object.entries(resolved)
  // const externalPackages = Object.keys(resolved).join(',')

  // // @ts-ignore
  // build.importMap = {
  //   imports: resolvedEntries.reduce((acc, [pkg, version]) => {
  //     acc[pkg] = `https://esm.sh/*${pkg}@${version}`
  //     acc[`${pkg}/`] = `https://esm.sh/*${pkg}@${version}/`
  //     return acc;
  //   }, {} as Record<string, string>)
  // }

  return build;
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
  rollup__bundle,
  npm__install,
};

export type Worker = typeof worker;

console.log('comlink.expose', worker);
comlink.expose(worker);
