import type {LogFunction} from '../src/types';
import type {PackageJSON} from '@parcel/types';
export type {PackageJSON};

export type File = {
  value: string;
  isEntry?: boolean;
};
export type FSMap = Map<string, File | FSMap>;
export type FSList = Array<[string, File]>;

export class FS implements Iterable<[string, File | FSMap]> {
  public files: FSMap;
  constructor(init?: FSMap);

  has(path: string): boolean;
  get(path: string): File | undefined;
  list(files?: FSMap, prefix?: string): Map<string, File>;
  move(from: string, to: string): FS;
  delete(path: string): FS;
  set(path: string, value: FSMap | File): FS;
  setMerge(path: string, value: Partial<File>): FS;
  [Symbol.iterator](): Iterator<[string, File | FSMap]>;
  toJSON(): Array<[string, File]>;
  static fromJSON(obj: Record<string, File>): FS;
}

export const ASSET_PRESETS: Map<string, {options?: REPLOptions; fs: FSMap}>;

export interface REPLOptions<RawProgress extends boolean = false> {
  entries?: string[];
  minify?: boolean;
  scopeHoist?: boolean;
  sourceMaps?: boolean;
  publicUrl?: string;
  targetType?: 'node' | 'browsers';
  targetEnv?: null | string;
  outputFormat?: null | 'esmodule' | 'commonjs' | 'global';
  mode?: 'production' | 'development';
  hmr?: boolean;
  renderGraphs?: boolean;
  viewSourcemaps?: boolean;
  dependencies: Record<string, string>;
  numWorkers?: number;
  rawProgress?: RawProgress;
  log?: false | LogFunction;
  registry: string;
}

export type BundleOutputError = {
  type: 'failure';
  error: string;
};
export type BundleOutputSuccess = {
  type: 'success';
  bundles: Array<{
    name: string;
    content: string;
    size: number;
    time: number;
  }>;
  buildTime: number;
  graphs?: Array<{name: string; content: string}>;
  sourcemaps?: Map<string, string>;
};

export type BundleOutput = BundleOutputSuccess | BundleOutputError;

export interface YarnProgressData {
  type?: string;
  displayName?: string;
  indent?: string;
  data: string;
}

export interface IParcelWorker {
  worker: Worker;
  clientIDPromise: Promise<string>;
  workerReady(numWorkers?: number): Promise<void>;
  waitForFS(): Promise<void>;
  preinstallPackages(
    dependencies: Record<string, string>,
    progress?: (msg: string | YarnProgressData) => void,
    options?: {
      log?: false | LogFunction;
      rawProgress?: boolean;
      registry?: string;
    },
  ): Promise<void>;
  bundle<RawProgress extends boolean = false>(
    files: FSList,
    options: REPLOptions<RawProgress>,
    progress: (
      msg: RawProgress extends true ? YarnProgressData : string,
    ) => void,
  ): Promise<BundleOutput>;
  watch(
    files: FS,
    options: REPLOptions,
    onBuild: (output: BundleOutput) => void,
    progress: (msg?: string) => void,
  ): Promise<{
    unsubscribe: () => Promise<any>;
    writeAssets: (fs: FS) => Promise<any>;
  }>;
}

function initWorker(
  workerUrl: URL,
  options: {
    previewHost: string;
    projectId: string;
    workerOptions?: WorkerOptions;
  },
): IParcelWorker;

export {initWorker};
