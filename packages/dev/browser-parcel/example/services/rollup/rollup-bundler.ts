import * as comlink from 'comlink';
import type { BundleOptions as BaseBundleOptions, Worker as RawEsbuildWorker } from './rollup-worker';
import { FileSystemManager } from '../file-system-manager';
import { NPMSpawnOptions } from './dependencies-installer';
import { MessageTarget } from '../message-target';

const makeIndexHTML = (options: { importMap: Record<string, string> }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parcel Web Bundler Demo</title>
  <link href="./index.css" type="text/css" rel="stylesheet">
  <script type="importmap">${JSON.stringify(options.importMap)}</script>
</head>
<body>
  <div id="root"></div>
  <script src="./index.js" type="module"></script>
</body>
</html>`;

export interface BundleOptions extends BaseBundleOptions {
  projectId: string;
}

export async function initWorker() {
  if (typeof window === 'undefined') {
    throw new Error('This module is only available in the browser');
  }

  const worker = comlink.wrap<RawEsbuildWorker>(
    new Worker(
      new URL('./rollup-worker.ts', import.meta.url),
      { type: 'module' },
    ),
  );

  const fs = FileSystemManager.fromSerializedRemote(worker);

  console.log('worker', worker);
  return {
    fs,
    npm__install: ({ reported, ...options }: NPMSpawnOptions) => worker.npm__install({
      ...options,
      // reported: reported ? comlink.proxy(reported) : reported,
    }),
    rollup__bundle: async (options: BundleOptions) => {
      const result = await worker.rollup__bundle(options);

      // if (result.errors.length === 0 && result.outputFiles) {
      //   const sw = await MessageTarget.fromServiceWorker();

      //   const uploadFinishPromise = new Promise<void>((resolve) => {
      //     const handler = (event: any) => {
      //       console.log('from SW', event);

      //       if (event.data?.type === 'UPLOAD_COMPLETE') {
      //         sw?.removeEventListener('message', handler);
      //         resolve();
      //       }
      //     };

      //     sw?.addEventListener('message', handler);
      //     setTimeout(resolve, 10_000);
      //   });

      //   await sw?.postMessage({
      //     type: 'UPLOAD_FILES',
      //     payload: {
      //       projectId: options.projectId,
      //       files: result.outputFiles.reduce<Record<string, string>>((acc, it) => {
      //         acc[it.path.replace(/^\//, '')] = it.text;
      //         return acc;
      //       }, {
      //         'index.html': makeIndexHTML({
      //           importMap: (result as any).importMap,
      //         }),
      //       }),
      //     }
      //   });

      //   await uploadFinishPromise
      // }

      return result;
    },
  };
}

type PromiseReturnType<T> = T extends Promise<infer U> ? U : T;
export type RollupWorker = PromiseReturnType<ReturnType<typeof initWorker>>;
