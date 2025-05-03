import * as comlink from 'comlink';
import { ParcelWorkerType, ParcelWebBundlerInitOptions, REPLOptions, LogFunction } from '../types'
import type { RemoteFileSystemManager } from '../@worker/fs/index';
import { MessageTarget } from '../worker-sw-bridge/message-target';
import { EventsFromSW, EventsToSW } from '../worker-sw-bridge';
import { NPMSpawnOptions } from '../@worker/npm/dependencies-installer';
import { FileSystemManager } from './file-system-manager';

export type {
  ParcelWorkerType,
  ParcelWebBundlerInitOptions,
  PackageJSON,
  FileSystem,
  REPLOptions,
} from '../types';

export interface ParcelWebBundlerInitializeOptions {
  project: {
    id: string;
  },
  npm: {
    sandpackCDNRegistry: string;
  },
  parcel?: {
    numWorkers?: number;
  },
  serviceWorker: {
    url: string;
  },
  worker: {
    url: URL;
    options?: WorkerOptions;
  }
}

let worker: comlink.Remote<ParcelWorkerType>

async function uploadFilesToSW(sw: MessageTarget, projectId: string, files: Record<string, string>) {
  const uploadFinishPromise = new Promise<void>((resolve) => {
    const handler = (event: any) => {
      if (event.data?.type === EventsFromSW.UPLOAD_FILES_FINISHED) {
        sw?.removeEventListener('message', handler);
        resolve();
      }
    };
    sw?.addEventListener('message', handler);
    setTimeout(resolve, 10_000);
  });

  await sw?.postMessage({
    type: EventsToSW.UPLOAD_FILES,
    payload: {
      projectId: projectId,
      files: files,
    }
  });

  return uploadFinishPromise;
}

export async function createParcelWebBundlerWorker(createOptions: ParcelWebBundlerInitializeOptions) {
  const {
    project,
    npm: npmOptions,
    parcel: parcelOptions,
    serviceWorker: serviceWorkerOptions,
    worker: workerOptions,
  } = createOptions;

  if (!worker) {
    worker = comlink.wrap<ParcelWorkerType>(
      new Worker(workerOptions.url, {
        name: 'Parcel Worker Main',
        type: 'module',
        ...(workerOptions.options ?? {}),
      }),
    );
  }

  await worker.system__init({
    numWorkers: parcelOptions?.numWorkers,
    sandpackCDNRegistry: npmOptions.sandpackCDNRegistry,
  });

  await navigator.serviceWorker?.register(serviceWorkerOptions.url);
  const sw = await MessageTarget.fromServiceWorker();
  const fs = FileSystemManager.fromSerializedRemote(worker);

  return {
    fs,
    npm: {
      install: async (
        options: Partial<NPMSpawnOptions>,
        logFn?: LogFunction,
      ) => {
        await worker.npm__install(
          options,
          logFn ? comlink.proxy(logFn) : undefined,
        );
      }
    },
    parcel: {
      build: async (options: REPLOptions) => {
        const results = await worker.parcel__build({
          ...options,
          publicUrl: `/__build/${project.id}`,
          minify: false,
          sourceMaps: false,
        });

        // Is success, submit results to service worker
        if (results.type === 'success') {
          const filesPrefix = '/dist/'

          await uploadFilesToSW(sw,
            project.id,
            {
              ...results.bundles.reduce<Record<string, string>>((acc, it) => {
                acc[it.name.slice(filesPrefix.length)] = it.content;
                return acc;
              }, {}),
              ...(results.sourcemaps
                ? Object.fromEntries(
                  Array.from(results.sourcemaps.entries()).map(
                    ([name, content]) => [name.slice(filesPrefix.length) + '.map', content]
                  )
                )
                : {}
              ),
            }
          );
        }

        return results;
      },
    }
  };
}

export type ParcelWorker = Awaited<ReturnType<typeof createParcelWebBundlerWorker>>;
