import type {FS, FSList, REPLOptions} from '../utils';
import type {BundleOutput} from './ParcelWorker';
import nanoid from '../nanoid';

import {proxy, wrap, transfer} from 'comlink';
import {YarnProgressData} from '../../types/library';

class MessageTarget {
  receive: any;
  post: any;
  constructor(receive: any, post: any) {
    this.receive = receive;
    this.post = post;
  }
  postMessage(...args: any[]): void {
    this.post.postMessage(...args);
  }
  addEventListener(...args: any[]): void {
    this.receive.addEventListener(...args);
  }
  removeEventListener(...args: any[]): void {
    this.receive.removeEventListener(...args);
  }
  sendMsg(type: string, data?: any, transfer?: Transferable[]): Promise<any> {
    let id = nanoid();
    return new Promise(res => {
      let handler = (evt: MessageEvent) => {
        if (evt.data.id === id) {
          this.removeEventListener('message', handler);
          res(evt.data.data);
        }
      };
      this.addEventListener('message', handler);
      this.postMessage({type, data, id}, transfer);
    });
  }
}

let worker: any;

export function initWorker(
  workerUrl: URL,
  options?: {
    workerOptions?: WorkerOptions;
    previewDomain?: string;
  },
) {
  if (!worker) {
    worker = wrap<Worker>(
      new Worker(workerUrl, {
        name: 'Parcel Worker Main',
        type: 'module',
        ...options?.workerOptions,
      }),
    );
  }

  let clientIDPromise: Promise<string> = Promise.resolve('no-sw');
  if (navigator.serviceWorker) {
    clientIDPromise = (async () => {
      let {active: serviceWorker} = await navigator.serviceWorker.ready;
      console.log('[debug] clientIDPromise::ready', serviceWorker);

      let sw = new MessageTarget(navigator.serviceWorker, serviceWorker);

      let {port1, port2} = new MessageChannel();

      // sw <-> port1 <-> port2 <-> parcel worker thread
      // sw <-> main thread
      console.log('[debug] clientIDPromise::port1', port1);
      console.log('[debug] clientIDPromise::port2', port2);

      sw.addEventListener('message', (evt: MessageEvent) => {
        console.log('sw@message', evt.data);
        port2.postMessage(evt.data);
      });
      port2.addEventListener('message', (evt: MessageEvent) => {
        console.log('port2@message', evt.data);
        sw.postMessage(evt.data);
      });

      port2.start();
      await worker.setServiceWorker(transfer(port1, [port1]));
      console.log('[debug] clientIDPromise::setServiceWorker', port1);

      if (options?.previewDomain) {
        console.log('[debug] sw::setPreviewDomain', options.previewDomain);
        await sw.sendMsg('setPreviewDomain', options.previewDomain);
      }

      return sw.sendMsg('getID');
    })();
  }

  return {
    worker,
    clientIDPromise,
    workerReady: (numWorkers?: number | null): Promise<void> => {
      return worker.ready(numWorkers);
    },
    waitForFS: (): Promise<void> => {
      return worker.waitForFS();
    },
    preinstallPackages: (
      dependencies: Record<string, string>,
      progress?: (msg: string | YarnProgressData) => void,
      options?: {rawProgress?: boolean},
    ): Promise<void> => {
      return worker.preinstallPackages(
        dependencies,
        progress ? proxy(progress) : undefined,
        options,
      );
    },
    bundle: (
      filesJson: FSList,
      options: REPLOptions,
      progress: (msg: string) => void,
    ): Promise<BundleOutput> => {
      return worker.bundle(filesJson, options, proxy(progress));
    },
    watch: async (
      files: FS,
      options: REPLOptions,
      onBuild: (output: BundleOutput) => void,
      progress: (msg: string | null) => void,
    ): Promise<{
      unsubscribe: () => Promise<unknown>;
      writeAssets: (fs: FS) => Promise<unknown>;
    }> => {
      let result = await worker.watch(
        files.toJSON(),
        options,
        proxy(onBuild),
        proxy(progress),
      );
      return {
        unsubscribe: result.unsubscribe,
        writeAssets: (f: FS) => result.writeAssets(f.toJSON()),
      };
    },
  };
}
