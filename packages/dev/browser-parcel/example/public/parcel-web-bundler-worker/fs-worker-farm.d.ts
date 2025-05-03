import WorkerFarm, { FarmOptions } from '@parcel/workers';
import { FileSystem } from '../types';
export type ExtendedWorkerFarm = WorkerFarm & {
    options: FarmOptions;
    readyWorkers: number;
    once: (event: 'ready', callback: () => void) => void;
    end: () => void;
};
interface WorkerFarmResult {
    fs: FileSystem;
    workerFarm: ExtendedWorkerFarm;
}
export declare function startWorkerFarm(numWorkers?: number): Promise<WorkerFarmResult>;
export {};
