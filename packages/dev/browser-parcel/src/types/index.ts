export type { ParcelWorkerType } from '../@worker/index';
export * from './fs'

export interface FileType {
  contents: string;
}

export type FileSystemType = Record<string, FileType>

export interface ParcelWebBundlerInitOptions {
  numWorkers?: number;
  sandpackCDNRegistry: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFunction = (level: LogLevel, ...args: any[]) => void;

export interface REPLOptions {
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
}

export interface BundleOutputError {
  type: 'failure';
  errorMessage: string;
  diagnostics?: string;
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
  sourcemaps: Map<string, string> | null;
}

export type BundleOutput = BundleOutputSuccess | BundleOutputError;

export interface Ref<T> {
  current: T;
}
