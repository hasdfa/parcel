import { LogFunction, ParcelWebBundlerInitOptions, REPLOptions } from '../types';
import { NPMSpawnOptions } from './npm/dependencies-installer';
declare function system__init(options: ParcelWebBundlerInitOptions): Promise<void>;
declare const ParcelWorker: {
    npm__install: (options?: Partial<NPMSpawnOptions>, logFn?: LogFunction) => Promise<void>;
    parcel__build: (options: REPLOptions) => Promise<import("../types").BundleOutputSuccess | {
        type: "failure";
        errorMessage: any;
        diagnostics: string;
    } | {
        type: "failure";
        errorMessage: any;
        diagnostics?: undefined;
    }>;
    fs__cwd: () => Promise<string>;
    fs__chdir: (filePath: string) => Promise<void>;
    fs__exists: (filePath: string) => Promise<boolean>;
    fs__isDirectory: (filePath: string) => Promise<boolean>;
    fs__writeFile: (filePath: string, contents: string) => Promise<void>;
    fs__appendFile: (filePath: string, contents: string) => Promise<void>;
    fs__readFile: (filePath: string) => Promise<string>;
    fs__deleteFile: (filePath: string) => Promise<void>;
    fs__setFiles: (files: import("./fs").ProjectFiles) => Promise<void>;
    fs__readdir: (filePath: string) => Promise<string[]>;
    system__init: typeof system__init;
};
export type ParcelWorkerType = typeof ParcelWorker;
export {};
