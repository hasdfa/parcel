import { IPCInitOptions } from "./ipc";
import { FileSystemManager } from "./file-system-manager";
import type { BuildOptions } from "esbuild-wasm";
export declare function initWorker(options: IPCInitOptions): Promise<{
    fs: FileSystemManager;
    npm__install: (props: {
        cwd?: string;
        registryBaseUrl: string;
        rawFiles?: Record<string, string>;
    }) => Promise<import("./ipc").NpmInstallResponse>;
    esbuild__bundle: (options: BuildOptions, props?: {
        rawFiles?: Record<string, string>;
    }) => Promise<import("./ipc").BuildResponse>;
}>;
export type EsbuildWorker = Awaited<ReturnType<typeof initWorker>>;
