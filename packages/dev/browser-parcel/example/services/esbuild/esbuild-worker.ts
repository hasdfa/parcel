import * as comlink from 'comlink';
import * as esbuild from 'esbuild-wasm';
import { FileSystemManager } from '../file-system-manager';
import { NPMInstaller, NPMSpawnOptions } from './dependencies-installer';
import { resolvePackageEntry } from './plugins/memfs-plugin/pkg-resolver';
import { setFilesBulk } from './helpers/fs';

const fs = new FileSystemManager();

const esbuildWasmPromise = esbuild.initialize({
  // wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.3/esbuild.wasm',
  wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.25.3/esbuild.wasm',
  worker: true, // run the WASM in current worker thread
})

export interface BundleOptions {
  entries: string[];
}

async function esbuild__bundle(options: BundleOptions) {
  await esbuildWasmPromise;

  // const resolved = await NPMInstaller.resolveDependencies(fs, {
  //   registryBaseUrl: 'https://npm-packages-cdn.onrender.com',
  // });

  setFilesBulk(fs.rawFiles);

  const startTime = Date.now();
  const build = await esbuild.build({
    entryPoints : options.entries,
    platform    : 'browser',
    bundle      : true,
    splitting   : true,
    packages    : 'external',
    chunkNames  : 'chunk-[name]-[hash].js',
    format      : 'esm',
    outdir      : '/dist/',
    // outfile     : 'main.js',
    sourcemap   : false,
    minifyIdentifiers: false,
    minifySyntax: false,
    minify: false,
    // format      : 'esm',
    // sourcemap   : 'inline',
    // write       : false,
    // loader      : { '.js':'jsx', '.jsx':'jsx', '.ts':'ts', '.tsx':'tsx', '.css':'css' },
    metafile    : false,
    // plugins     : [
    //   // tailwindPlugin(),
    //   // esmShExternalResolver({}),
    //   // memfsPlugin(fs),
    // ],
  });

  console.log('Build finished in', Math.round((Date.now() - startTime) / 100) / 10, 's');
  console.log('build', build);

  build.outputFiles?.forEach((file) => {
    // file.path = file.path.replace(/^\//, '');
    file.path = file.path.slice('/dist/'.length);
  });

  const resolvedEntries = Object.entries(resolved)
  const externalPackages = Object.keys(resolved).join(',')

  // @ts-ignore
  build.importMap = {
    imports: resolvedEntries.reduce((acc, [pkg, version]) => {
      acc[pkg] = `https://esm.sh/*${pkg}@${version}`
      acc[`${pkg}/`] = `https://esm.sh/*${pkg}@${version}/`
      return acc;
    }, {} as Record<string, string>)
  }

  return build;
}

async function npm__install(options: NPMSpawnOptions) {
  console.log('npm__install', options);
  await NPMInstaller.install(fs, options).catch((error) => {
    console.error('npm__install', error);
    console.log('fs_dump', JSON.stringify(Object.fromEntries(Object.entries(fs.files).map(([key, value]) => [key, value.contents.slice(0, 100)])), null, 2));
  });
}

async function esbuild__resolvePackage(spec: string) {
  return resolvePackageEntry(fs, fs.cwd(), spec);
}

const worker = {
  ...fs.toSerializable(),
  esbuild__resolvePackage,
  esbuild__bundle,
  npm__install,
};

export type Worker = typeof worker;

console.log('comlink.expose', worker);
comlink.expose(worker);
