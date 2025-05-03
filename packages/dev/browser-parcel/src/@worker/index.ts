import { expose } from 'comlink';
import { LogFunction, ParcelWebBundlerInitOptions, REPLOptions, Ref } from '../types'
import { startWorkerFarm, WorkerFarmResult } from './fs/fs-worker-farm';
import { NPMInstaller, NPMSpawnOptions } from './npm/dependencies-installer';
import { collectParcelBuildResults } from './parcel/parcel-results';
import { renderDiagnostics } from './parcel/parcel-diagnostic';
import { setupParcelBundler } from './parcel';
import PathUtils from './path-utils';
import { createParcelFS } from './fs';

type InitPromiseResult = WorkerFarmResult & {
  options: ParcelWebBundlerInitOptions;
}

let initPromise: Ref<PromiseLike<InitPromiseResult>> = {
  current: {
    then: () => {
      return Promise.reject(new Error('You should call system__init(ParcelWebBundlerInitOptions) first'));
    }
  }
}

async function system__init(options: ParcelWebBundlerInitOptions) {
  console.log('ParcelWorker.init', options);
  initPromise.current = startWorkerFarm(options.numWorkers).then(({ fs, workerFarm }) => {
    return {
      fs,
      workerFarm,
      options,
    }
  });

  const { fs, workerFarm, options: initOptions } = await initPromise.current;
  console.log('[done] ParcelWorker.init', fs, workerFarm, initOptions);
}

// class ParcelWorker implements ParcelWebBundlerWorkerInstance {
//   private serviceWorker: MessagePort | undefined;

//   public static readonly init = async (options: ParcelWebBundlerInitOptions) => {
//   }

//   private constructor(
//     public readonly options: ParcelWebBundlerInitOptions,
//     public readonly fs: FileSystem,
//     public readonly workerFarm: ExtendedWorkerFarm,
//   ) {
//   }

//   public readonly system__setServiceWorker = async (serviceWorker: MessagePort) => {
//     console.log('system__setServiceWorker', serviceWorker);
//     this.serviceWorker = serviceWorker;

//     await initWorkerSWBridge({
//       type: 'worker',
//       sw: this.serviceWorker,
//     });
//   }

//   public readonly fs__init = async (files: FileSystemType) => {
//     console.log('fs__init', files);
//     for (const [name, file] of Object.entries(files)) {
//       await this.fs.writeFile(PathUtils.fromAssetPath(name), file.contents, undefined);
//     }
//   }
//   public readonly fs__readFile = async (fileName: string): Promise<FileType | null> => {
//     console.log('fs__readFile', fileName);
//     const file = await this.fs.readFile(PathUtils.fromAssetPath(fileName), 'utf8');
//     return file ? { contents: file } : null;
//   }
//   public readonly fs__deleteFile = async (fileName: string) => {
//     console.log('fs__deleteFile', fileName);
//     await this.fs.unlink(PathUtils.fromAssetPath(fileName));
//   }
//   public readonly fs__writeFile = async (fileName: string, file: FileType) => {
//     console.log('fs__writeFile', fileName, file);
//     await this.fs.writeFile(PathUtils.fromAssetPath(fileName), file.contents, undefined);
//   }

//   public readonly parcel__bundle = async (options: REPLOptions) => {
//     console.log('parcel__bundle', options);
//     const { bundler } = await setupParcelBundler(this.fs, this.workerFarm, options);
//     try {
//       let event = await bundler.run();
//       // writeProgress('Build success', 'success');
//       return await collectParcelBuildResults(event, this.fs);
//     } catch (error: any) {
//       console.error(error, error.diagnostics);
//       // writeProgress('🚨 Build failed.', 'error');
//       // writeProgress((error.message || error).toString(), 'error');
//       // console.error('Diagnostics', error.diagnostics);
//       // if (error.diagnostics) {
//       //   const rendred = await renderDiagnostics(this.fs, error.diagnostics).catch(
//       //     error => {
//       //       console.error('Error rendering diagnostics', error);
//       //       return error;
//       //     },
//       //   );
//       //   writeProgress(rendred?.toString() ?? '', 'error');
//       // }

//       if (error.diagnostics) {
//         return {
//           type: 'failure' as const,
//           errorMessage: (error.message || error).toString(),
//           diagnostics: await renderDiagnostics(this.fs, error.diagnostics),
//         };
//       } else {
//         return {
//           type: 'failure' as const,
//           errorMessage: (error.message || error).toString(),
//         };
//       }
//     }
//   }
//   public readonly parcel__watch = async () => {
//     console.log('parcel__watch');
//     return {
//       unsubscribe: async () => {
//         console.log('unsubscribe');
//       }
//     }
//   }

//   public readonly npm__install = async (options?: NPMSpawnOptions) => {
//     console.log('npm__install', options);
//     await NPMInstaller.install(this.fs, {
//       registryBaseUrl: this.options.sandpackCDNRegistry,
//       cwd: PathUtils.APP_DIR,
//       ...options,
//     });
//   }
// }

const parcelFS = createParcelFS(initPromise);

const ParcelWorker = {
  system__init,

  // FS sync
  ...parcelFS,

  npm__install: async (
    options?: Partial<NPMSpawnOptions>,
    logFn?: LogFunction,
  ) => {
    const { fs, options: initOptions } = await initPromise.current;
    console.log('npm__install:start', options);
    await NPMInstaller.install(fs, {
      registryBaseUrl: initOptions.sandpackCDNRegistry,
      cwd: PathUtils.APP_DIR,
      ...options,
    }, logFn);
    console.log('npm__install:finished');
  },


  parcel__build: async (options: REPLOptions) => {
    const { fs, workerFarm } = await initPromise.current;

    console.log('parcel__bundle', options);
    const { bundler } = await setupParcelBundler(fs, workerFarm, options);
    try {
      let event = await bundler.run();
      // writeProgress('Build success', 'success');
      return await collectParcelBuildResults(event, fs);
    } catch (error: any) {
      console.error(error, error.diagnostics);
      // writeProgress('🚨 Build failed.', 'error');
      // writeProgress((error.message || error).toString(), 'error');
      // console.error('Diagnostics', error.diagnostics);
      // if (error.diagnostics) {
      //   const rendred = await renderDiagnostics(this.fs, error.diagnostics).catch(
      //     error => {
      //       console.error('Error rendering diagnostics', error);
      //       return error;
      //     },
      //   );
      //   writeProgress(rendred?.toString() ?? '', 'error');
      // }

      if (error.diagnostics) {
        return {
          type: 'failure' as const,
          errorMessage: (error.message || error).toString(),
          diagnostics: await renderDiagnostics(fs, error.diagnostics),
        };
      } else {
        return {
          type: 'failure' as const,
          errorMessage: (error.message || error).toString(),
        };
      }
    }
  }
}

expose(ParcelWorker);

export type ParcelWorkerType = typeof ParcelWorker;
