import WorkerFarm, { FarmOptions } from '@parcel/workers';
import { createWorkerFarm } from '@parcel/core';
import { ExtendedMemoryFS } from '../fs/extended-memory-fs'
import { FileSystem } from '../../types'

export type ExtendedWorkerFarm = WorkerFarm & {
  options: FarmOptions
  readyWorkers: number
  once: (event: 'ready', callback: () => void) => void
  end: () => void
}

let fs: FileSystem;
let workerFarm: ExtendedWorkerFarm;

export interface WorkerFarmResult {
  fs: FileSystem
  workerFarm: ExtendedWorkerFarm
}

export async function startWorkerFarm(numWorkers?: number): Promise<WorkerFarmResult> {
  if (!workerFarm || workerFarm.options.maxConcurrentWorkers !== numWorkers) {
    workerFarm?.end();

    console.log('createWorkerFarm', { numWorkers });
    workerFarm = createWorkerFarm(
      numWorkers != null ? { maxConcurrentWorkers: numWorkers } : {},
    ) as ExtendedWorkerFarm;

    console.log('createExtendedMemoryFS', { workerFarm });
    fs = new ExtendedMemoryFS(workerFarm) as unknown as FileSystem;
    fs.chdir('/app');
    console.log('fs.chdir', { fs });

    // @ts-ignore
    globalThis.fs = fs;
    // @ts-ignore
    globalThis.workerFarm = workerFarm;
  }

  return new Promise<WorkerFarmResult>((resolve, reject) => {
    if (workerFarm.readyWorkers === workerFarm.options.maxConcurrentWorkers) {
      resolve({ fs, workerFarm });
    } else {
      workerFarm.once('ready', () => resolve({ fs, workerFarm }));
    }

    setTimeout(() => {
      if (workerFarm.readyWorkers !== workerFarm.options.maxConcurrentWorkers) {
        console.warn(
          `Worker farm is not ready after 10 seconds. Only ${workerFarm.readyWorkers} workers are ready.`,
        );
      }
    }, 10_000);

    setTimeout(() => {
      if (workerFarm.readyWorkers !== workerFarm.options.maxConcurrentWorkers) {
        reject(
          new Error(
            `Worker farm is not ready after 30 seconds. Only ${workerFarm.readyWorkers} workers are ready.`,
          ),
        );
      }
    }, 30_000);
  })
}
