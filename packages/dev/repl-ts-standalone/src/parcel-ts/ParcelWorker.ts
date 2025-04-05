import type {Diagnostic} from '@parcel/diagnostic';
import type {FSList} from '../utils';
import type {FileSystem, LogFunction, LogLevel} from '../types/index';
import {YarnProgressData, REPLOptions} from '../../types/library';
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
// import {yarnInstall} from './yarn';
import {PackageManager} from './my-yarn';
import {uuidv4} from '../nanoid';
import path from 'path';

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
  getFsPaths,
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
}

const readDirRecursive = async (
  fs: FileSystem,
  _path: string,
): Promise<string[]> => {
  const files = await fs.readdir(_path).catch(() => []);
  const allFiles = await Promise.all(
    files.map(async (file: string) => {
      const filePath = path.join(_path, file);
      const stats = await fs.stat(filePath).catch(() => null);
      if (!stats) return null;

      if (stats.isDirectory()) {
        return readDirRecursive(fs, filePath);
      } else {
        return filePath;
      }
    }),
  );

  return allFiles.filter(Boolean).flat() as any[];
};

async function getFsPaths() {
  return await readDirRecursive(fs, '/');
}

async function preinstallPackages(
  dependencies: Record<string, string>,
  progress: (msg: string | YarnProgressData) => void | undefined,
  options: {rawProgress?: boolean; log?: LogFunction; registry: string},
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

  await fs.mkdirp(PathUtils.APP_DIR).catch(() => {});
  // await yarnInstall(dependencies, fs, PathUtils.APP_DIR, progressFn, {
  //   registry: options?.registry,
  //   ignorePackageJson: true,
  //   log: options?.log,
  // });
  await PackageManager.install(fs, {
    dependencies,
    registryBaseUrl: options?.registry,
    cwd: PathUtils.APP_DIR,
    reported: (type, data) => {
      progressFn({type, data});
    },
  });
}

function logFn(base?: LogFunction | false): LogFunction | undefined {
  if (base === false) return undefined;
  if (!base)
    return (level: LogLevel, ...args: any[]) => {
      console[level === 'info' ? 'log' : level](...args);
    };

  return base;
}

async function bundle(
  assets: FSList,
  preview: {
    projectId: string;
    previewHost: string;
  },
  options: REPLOptions,
  progress: (msg: string | YarnProgressData) => void,
): Promise<BundleOutput> {
  const {bundler, graphs} = await setup(assets, {...options, hmr: false});
  // const log = logFn(options.log);

  resetSWPromise();
  await syncAssetsToFS(assets, options);

  const previewDataJson = JSON.stringify(preview);
  await fs.writeFile('/.preview-data', previewDataJson, undefined);
  await fs.writeFile('/app/.preview-data', previewDataJson, undefined);

  // await yarnInstall(
  //   options.dependencies,
  //   fs,
  //   PathUtils.APP_DIR,
  //   v => {
  //     if (options.rawProgress) {
  //       progress(v);
  //     } else if (v.data.includes('Resolution step')) {
  //       progress('Yarn: Resolving');
  //     } else if (v.data.includes('Fetch step')) {
  //       progress('Yarn: Fetching');
  //     } else if (v.data.includes('Link step')) {
  //       progress('Yarn: Linking');
  //     }
  //   },
  //   {log},
  // );
  await PackageManager.install(fs, {
    cwd: PathUtils.APP_DIR,
    registryBaseUrl: options?.registry,
    reported: (type, data) => {
      if (options.rawProgress) {
        progress({type, data});
      } else {
        progress(data);
      }
    },
  });

  const writeProgress = (data: string, type?: string) => {
    if (options.rawProgress) {
      progress({data, type});
    } else {
      progress(data);
    }
  };

  writeProgress('> npm run build');
  writeProgress('Start building...');

  try {
    let event = await bundler.run();
    writeProgress('Build success', 'success');
    return await collectResult(event, graphs, fs);
  } catch (error: any) {
    console.error(error, error.diagnostics);
    writeProgress('Build failed', 'error');
    writeProgress((error.message || error).toString(), 'error');
    console.error('Diagnostics', error.diagnostics);
    if (error.diagnostics) {
      const rendred = await renderDiagnostics(fs, error.diagnostics).catch(
        error => {
          console.error('Error rendering diagnostics', error);
          return error;
        },
      );
      console.error('Rendering diagnostics', rendred);
      writeProgress(rendred?.toString() ?? '', 'error');
    }

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
  progress: (msg: string | YarnProgressData) => void,
): Promise<{
  unsubscribe: () => Promise<any>;
  writeAssets: (assets: FSList) => Promise<any>;
}> {
  const log = logFn(options.log);
  let {bundler, graphs} = await setup(assets, options);

  resetSWPromise();
  await syncAssetsToFS(assets, options);

  // await yarnInstall(
  //   options.dependencies,
  //   fs,
  //   PathUtils.APP_DIR,
  //   v => {
  //     if (v.data.includes('Resolution step')) {
  //       progress('Yarn: Resolving');
  //     } else if (v.data.includes('Fetch step')) {
  //       progress('Yarn: Fetching');
  //     } else if (v.data.includes('Link step')) {
  //       progress('Yarn: Linking');
  //     }
  //   },
  //   {
  //     log,
  //     registry: options.registry,
  //   },
  // );
  await PackageManager.install(fs, {
    cwd: PathUtils.APP_DIR,
    registryBaseUrl: options?.registry,
    reported: (type, data) => {
      if (options.rawProgress) {
        progress({type, data});
      } else {
        progress(data);
      }
    },
  });

  if (options.rawProgress) {
    progress({data: 'Bundling'});
  } else {
    progress('Bundling');
  }

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
              console.debug(event.diagnostics);
              onBuild({
                type: 'failure',
                error: await renderDiagnostics(fs, event.diagnostics),
                // diagnostics: await convertDiagnostics(fs, event.diagnostics),
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

  let id = uuidv4();
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
