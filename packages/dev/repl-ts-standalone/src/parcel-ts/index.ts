import type {FS, FSList, REPLOptions} from '../utils';
import type {BundleOutput} from './ParcelWorker';
import {uuidv4} from '../nanoid';

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
    let id = uuidv4();
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
  initOptions: {
    previewHost: string;
    projectId: string;
    workerOptions?: WorkerOptions;
  },
) {
  if (!worker) {
    worker = wrap<Worker>(
      new Worker(workerUrl, {
        name: 'Parcel Worker Main',
        type: 'module',
        ...initOptions?.workerOptions,
      }),
    );
  }

  let clientIDPromise: Promise<string> = Promise.resolve('no-sw');
  if (navigator.serviceWorker) {
    clientIDPromise = (async () => {
      let {active: serviceWorker} = await navigator.serviceWorker.ready;
      let sw = new MessageTarget(navigator.serviceWorker, serviceWorker);

      let {port1, port2} = new MessageChannel();

      // sw <-> port1 <-> port2 <-> parcel worker thread
      // sw <-> main thread

      sw.addEventListener('message', (evt: MessageEvent) => {
        port2.postMessage(evt.data);
      });
      port2.addEventListener('message', (evt: MessageEvent) => {
        sw.postMessage(evt.data);
      });

      port2.start();
      await worker.setServiceWorker(transfer(port1, [port1]));

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
    getFsPaths: (): Promise<string[]> => {
      return worker.getFsPaths();
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
      return worker.bundle(
        filesJson,
        {
          projectId: initOptions.projectId,
          previewHost: initOptions.previewHost,
        },
        {
          ...options,
          log: options.log ? proxy(options.log) : undefined,
        },
        proxy(progress),
      );
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
