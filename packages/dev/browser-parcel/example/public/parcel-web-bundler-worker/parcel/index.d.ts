import Parcel from '@parcel/core';
import { REPLOptions, FileSystem } from '../../types';
import { ExtendedWorkerFarm } from '../fs/fs-worker-farm';
export declare function setupParcelBundler(fs: FileSystem, workerFarm: ExtendedWorkerFarm, options: REPLOptions): Promise<{
    bundler: Parcel;
}>;
