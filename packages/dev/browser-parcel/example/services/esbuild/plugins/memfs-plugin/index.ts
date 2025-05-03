import path from "path";
import type { Plugin, Loader } from "esbuild-wasm";
import { FileSystemManager } from "@/services/file-system-manager";
import { resolvePackageEntry } from "./pkg-resolver";
import { jsResolver } from "./js-resolver";

const namespace = 'memfs-plugin';

const loadersMap: [RegExp, Loader][] = [
  [/.tsx?$/, 'tsx'],
  [/.jsx?$/, 'jsx'],
  [/.css$/, 'css'],
  [/.scss$/, 'css'],
  [/.sass$/, 'css'],
  [/.styl$/, 'css'],
  [/.pcss$/, 'css'],
  [/.postcss$/, 'css'],
  [/.pcss$/, 'css'],
  [/.postcss$/, 'css'],
  [/.json$/, 'json'],
]

const loaderFor = (p: string): Loader => {
  for (const [regex, loader] of loadersMap) {
    if (regex.test(p)) {
      return loader as Loader;
    }
  }

  return 'js';
}

export function virtualResolvePath(fs: FileSystemManager, spec: string, resolveDir: string) {
  /** 1 — absolute & relative specifiers */
  if (spec.startsWith('/') || spec.startsWith('.')) {
    const bare = path.join(resolveDir || fs.cwd(), spec);
    const resolvedPath = jsResolver(bare, fs)
    if (resolvedPath) {
      // console.log('resolvedPath', resolvedPath);
      return resolvedPath
    }
  }

  /** 2 — bare specifiers → node_modules  */
  const resolvedPath = resolvePackageEntry(fs, fs.cwd(), spec)
  if (resolvedPath) {
    return resolvedPath
  }

  return; // fall through = unresolved (esbuild will error)
}

export default function esbuildMemfsPlugin(fs: FileSystemManager): Plugin {
  return {
    name: 'esbuild-memfs-plugin',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        const { path: spec } = args;
        // console.log('onResolve', JSON.stringify(args, null, 2));

        const resolved = virtualResolvePath(fs, spec, args.resolveDir);
        if (resolved) {
          return { path: resolved, namespace };
        }

        if (!spec.endsWith('.map')) {
          console.log('UNRESOLVED', JSON.stringify({ args, resolved }, null, 2));
        }
        return; // fall through = unresolved (esbuild will error)
      });

      build.onLoad({ filter: /.*/, namespace }, args => {
        console.log('onLoad', args.path);
        return {
          contents: fs.readFile(args.path),
          loader : loaderFor(args.path),
          resolveDir: args.path.endsWith('/') ? args.path : args.path.replace(/\/[^/]+$/, ''),
        }
      });
    },
  };
}
