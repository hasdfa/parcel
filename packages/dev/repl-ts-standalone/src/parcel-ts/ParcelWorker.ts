import type {Diagnostic} from '@parcel/diagnostic';
import type {FSList, REPLOptions} from '../utils';
import type {FileSystem} from '../types/index';
import type {BuildSuccessEvent} from '@parcel/types';
import WorkerFarm from '@parcel/workers';

import {expose, proxy} from 'comlink';
import Parcel, {createWorkerFarm} from '@parcel/core';
import {
  // @ts-ignore
  makeDeferredWithPromise,
  // @ts-ignore
  prettyDiagnostic,
} from '@parcel/utils';
import configRepl from '../config/parcelrc.json';

import {ExtendedMemoryFS as ExtendedFileSystem} from './ExtendedMemoryFS';
import {generatePackageJson} from '../utils/';
import {BrowserPackageManager} from './BrowserPackageManager';
import {yarnInstall} from './yarn';
import nanoid from '../nanoid';
import path from 'path';

import type {YarnProgressData} from '../../types/library';

export interface BundleOutputError {
  type: 'failure';
  error: string;
}

export interface BundleOutputSuccess {
  type: 'success';
  bundles: Array<{
    name: string;
    content: string;
    size: number;
    time: number;
  }>;
  buildTime: number;
  graphs: Array<{name: string; content: string}> | null;
  sourcemaps: Map<string, string> | null;
}

export type BundleOutput = BundleOutputSuccess | BundleOutputError;

let workerFarm: WorkerFarm;
let fs: FileSystem;

function startWorkerFarm(numWorkers?: number) {
  console.log('[debug] startWorkerFarm', {numWorkers});

  if (!workerFarm || workerFarm.options.maxConcurrentWorkers !== numWorkers) {
    workerFarm?.end();
    workerFarm = createWorkerFarm(
      numWorkers != null ? {maxConcurrentWorkers: numWorkers} : {},
    );
    fs = new ExtendedFileSystem(workerFarm) as unknown as FileSystem;
    fs.chdir('/app');

    // @ts-ignore
    globalThis.fs = fs;
    // @ts-ignore
    globalThis.workerFarm = workerFarm;
    console.log('[debug] startedWorkerFarm', fs, workerFarm);
  }
}

let swFSPromise: Promise<void>, resolveSWFSPromise: () => void;
function resetSWPromise() {
  ({
    promise: swFSPromise,
    deferred: {resolve: resolveSWFSPromise},
  } = makeDeferredWithPromise<void>());
}

let sw: MessagePort;
// @ts-ignore
global.PARCEL_SERVICE_WORKER = async (type: string, data: any) => {
  await sendMsg(sw, type, data);
  if (type === 'setFS') {
    resolveSWFSPromise();
  }
};
interface ExtendableMessageEvent {
  data: {
    type: string;
    id: string;
    data: any;
  };
}
// @ts-ignore
global.PARCEL_SERVICE_WORKER_REGISTER = (
  type: string,
  cb: (data: any) => Promise<any>,
) => {
  let wrapper = async (evt: ExtendableMessageEvent) => {
    if (evt.data.type === type) {
      let response = await cb(evt.data.data);
      sw.postMessage({
        type,
        id: evt.data.id,
        data: response,
      });
    }
  };

  sw.addEventListener('message', wrapper);
  return () => sw.removeEventListener('message', wrapper);
};

expose({
  preinstallPackages,
  bundle,
  watch,
  ready: (numWorkers: number) =>
    new Promise(res => {
      startWorkerFarm(numWorkers);
      if (workerFarm.readyWorkers === workerFarm.options.maxConcurrentWorkers) {
        res(true);
      } else {
        workerFarm.once('ready', () => res(true));
      }
    }),
  waitForFS: () => proxy(swFSPromise),
  setServiceWorker: (v: MessagePort) => {
    sw = v;
    sw.start();
  },
});

const PathUtils = {
  APP_DIR: '/app',
  DIST_DIR: '/app/dist',
  CACHE_DIR: '/.parcel-cache',
  fromAssetPath(str: string): string {
    return path.join('/app', str);
  },
  toAssetPath(str: string): string {
    return str.startsWith('/app/') ? str.slice(5) : str;
  },
};

function removeTrailingNewline(text: string): string {
  if (text[text.length - 1] === '\n') {
    return text.slice(0, -1);
  } else {
    return text;
  }
}

async function renderDiagnostics(
  inputFS: FileSystem,
  diagnostics: Array<Diagnostic>,
): Promise<string> {
  return (
    await Promise.all(
      diagnostics.map(async diagnostic => {
        let {message, stack, codeframe, hints, documentation} =
          await prettyDiagnostic(
            diagnostic,
            {projectRoot: '/', inputFS},
            80,
            'html',
          );
        let result = '';

        result += message;
        result += '\n\n';
        if (stack) {
          result += stack;
          result += '\n';
        }
        if (codeframe) {
          result += codeframe;
          result += '\n';
        }
        if (hints.length > 0) {
          for (let h of hints) {
            result += h;
            result += '\n';
          }
        }
        if (documentation) {
          result += documentation;
          result += '\n';
        }

        return result;
      }),
    )
  ).join(`\n${'-'.repeat(80)}\n\n`);
}

async function setup(assets: FSList, options: REPLOptions) {
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

  let graphs: {name: string; content: string}[] | null = options.renderGraphs
    ? []
    : null;
  if (graphs && options.renderGraphs) {
    // @ts-ignore
    globalThis.PARCEL_DUMP_GRAPHVIZ = (name: string, content: string) =>
      graphs.push({name, content});
    // @ts-ignore
    globalThis.PARCEL_DUMP_GRAPHVIZ.mode = options.renderGraphs;
  }

  // TODO only create new instance if options/entries changed
  let entries = assets
    .filter(([, data]) => data.isEntry)
    .map(([name]) => PathUtils.fromAssetPath(name));
  console.log('[debug] setup::entries', entries);
  const bundler = new Parcel({
    entries,
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

  return {bundler, graphs};
}

async function collectResult(
  event: BuildSuccessEvent,
  graphs: Array<{name: string; content: string}> | null,
  fs: FileSystem,
): Promise<BundleOutput> {
  let bundleContents: {
    name: string;
    content: string;
    size: number;
    time: number;
  }[] = [];
  if ('toJSON' in fs && typeof fs.toJSON === 'function') {
    console.log('[debug] FS.toJSON', fs.toJSON());
  } else {
    console.log('[debug] FS', fs);
  }

  console.log('[debug] event.bundleGraph', event.bundleGraph);
  console.log(
    '[debug] event.bundleGraph.getBundles()',
    event.bundleGraph.getBundles(),
  );

  let sourcemaps = new Map<string, string>();
  for (let b of event.bundleGraph.getBundles()) {
    let {
      filePath,
      stats: {size, time},
    } = b;

    let name = PathUtils.toAssetPath(filePath);
    let content = removeTrailingNewline(await fs.readFile(filePath, 'utf8'));
    bundleContents.push({
      name,
      content,
      size,
      time,
    });
    if (content.length < 5000000 && (await fs.exists(filePath + '.map'))) {
      sourcemaps.set(name, await fs.readFile(filePath + '.map', 'utf8'));
    }
  }

  bundleContents.sort(({name: a}, {name: b}) => a.localeCompare(b));

  return {
    type: 'success',
    bundles: bundleContents,
    buildTime: event.buildTime,
    graphs,
    sourcemaps,
  };
}

async function syncAssetsToFS(assets: FSList, options: REPLOptions) {
  await fs.mkdirp('/app');

  let filesToKeep = new Set([
    '/app/.yarn',
    '/app/node_modules',
    '/app/yarn.lock',
    '/app/package.json',
    ...assets.map(([name]) => PathUtils.fromAssetPath(name)),
  ]);
  console.log('[debug] fs-sync::filesToKeep', filesToKeep);

  for (let [name, {value}] of assets) {
    if (name === '/package.json') continue;
    let p = PathUtils.fromAssetPath(name);
    await fs.mkdirp(path.dirname(p));
    if (!(await fs.exists(p)) || (await fs.readFile(p, 'utf8')) !== value) {
      await fs.writeFile(p, value, undefined);
    }
  }

  let oldPackageJson = (await fs.exists('/app/package.json'))
    ? await fs.readFile('/app/package.json', 'utf8')
    : null;
  let newPackageJson =
    assets.find(([name]) => name === '/package.json')?.[1].value ??
    generatePackageJson(options);

  if (!oldPackageJson || oldPackageJson.trim() !== newPackageJson.trim()) {
    await fs.writeFile('/app/package.json', newPackageJson, undefined);
  }

  for (let f of await fs.readdir('/app')) {
    f = '/app/' + f;
    if (filesToKeep.has(f) || [...filesToKeep].some(k => k.startsWith(f))) {
      continue;
    }
    await fs.rimraf(f);
  }

  console.log(
    '[debug] fs-sync::success',
    JSON.stringify(
      {
        // @ts-ignore
        dirs: fs.dirs,
        // @ts-ignore
        files: fs.files,
      },
      null,
      2,
    ),
  );
}

async function preinstallPackages(
  dependencies: Record<string, string>,
  progress?: (msg: string | YarnProgressData) => void,
  options?: {rawProgress?: boolean},
): Promise<void> {
  const progressFn = progress
    ? options?.rawProgress
      ? progress
      : (v: YarnProgressData) => {
          if (v.data.includes('Resolution step')) {
            progress('Yarn: Resolving');
          } else if (v.data.includes('Fetch step')) {
            progress('Yarn: Fetching');
          } else if (v.data.includes('Link step')) {
            progress('Yarn: Linking');
          }
        }
    : () => {};

  await fs.mkdirp('/app').catch(() => {});
  await yarnInstall(dependencies, fs, PathUtils.APP_DIR, progressFn, {
    ignorePackageJson: true,
  });
}

async function bundle(
  assets: FSList,
  options: REPLOptions,
  progress: (
    msg:
      | string
      | {type: string; displayName: string; indent: string; data: string},
  ) => void,
): Promise<BundleOutput> {
  console.log('[debug] bundle::init', assets, options, progress);
  const {bundler, graphs} = await setup(assets, {...options, hmr: false});
  console.log('[debug] bundle::setup', bundler, graphs);

  resetSWPromise();
  await syncAssetsToFS(assets, options);
  console.log('[debug] bundle::fs-synced');

  await yarnInstall(options.dependencies, fs, PathUtils.APP_DIR, v => {
    if (options.rawProgress) {
      progress(v);
    } else if (v.data.includes('Resolution step')) {
      progress('Yarn: Resolving');
    } else if (v.data.includes('Fetch step')) {
      progress('Yarn: Fetching');
    } else if (v.data.includes('Link step')) {
      progress('Yarn: Linking');
    }
  });

  progress('Bundling');

  try {
    let event = await bundler.run();
    console.log('[debug] bundle::runned', event);
    return await collectResult(event, graphs, fs);
  } catch (error: any) {
    console.error(error, error.diagnostics);

    if (error.diagnostics) {
      return {
        type: 'failure',
        error: await renderDiagnostics(fs, error.diagnostics),
        // diagnostics: await convertDiagnostics(fs, error.diagnostics),
      };
    } else {
      return {
        type: 'failure',
        error: error,
      };
    }
  }
}

async function watch(
  assets: FSList,
  options: REPLOptions,
  onBuild: (output: BundleOutput) => void,
  progress: (msg: string | null) => void,
): Promise<{
  unsubscribe: () => Promise<any>;
  writeAssets: (assets: FSList) => Promise<any>;
}> {
  let {bundler, graphs} = await setup(assets, options);

  resetSWPromise();
  await syncAssetsToFS(assets, options);

  await yarnInstall(options.dependencies, fs, PathUtils.APP_DIR, v => {
    if (v.data.includes('Resolution step')) {
      progress('Yarn: Resolving');
    } else if (v.data.includes('Fetch step')) {
      progress('Yarn: Fetching');
    } else if (v.data.includes('Link step')) {
      progress('Yarn: Linking');
    }
  });

  progress('building');

  return proxy({
    unsubscribe: (
      await bundler.watch(async (err, event) => {
        if (event) {
          switch (event.type) {
            case 'buildSuccess': {
              let result = await collectResult(event, graphs, fs);
              onBuild(result);
              break;
            }
            case 'buildFailure': {
              console.log(event.diagnostics);
              onBuild({
                type: 'failure',
                error: await renderDiagnostics(fs, event.diagnostics),
                diagnostics: await convertDiagnostics(fs, event.diagnostics),
              });
              break;
            }
          }
        }
      })
    ).unsubscribe,
    writeAssets: (assets: FSList) => {
      resetSWPromise();
      return syncAssetsToFS(assets, options);
    },
  });
}

async function sendMsg(
  target: MessagePort,
  type: string,
  data: any,
  transfer?: Transferable[],
): Promise<any> {
  if (!target) {
    throw new Error('Could not send message, target is not a MessagePort');
  }

  let id = nanoid();
  return new Promise(res => {
    let handler = (evt: MessageEvent) => {
      if (evt.data.id === id) {
        target.removeEventListener('message', handler);
        res(evt.data.data);
      }
    };
    target.addEventListener('message', handler);
    target.postMessage({type, data, id}, transfer as any);
  });
}
