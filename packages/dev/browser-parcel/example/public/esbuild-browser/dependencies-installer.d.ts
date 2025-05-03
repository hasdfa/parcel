import type { BaseFileSystemManager as FileSystem } from './file-system-manager';
export interface NPMSpawnOptions {
    cwd?: string;
    reported?: (type: 'error' | 'info', message: string) => void;
    dependencies?: Record<string, string>;
    registryBaseUrl: string;
}
export declare class NPMInstaller {
    private static scriptsMap;
    private static cwd;
    private static getPackageJson;
    static resolveDependencies(fs: FileSystem, options: NPMSpawnOptions): Promise<{
        [k: string]: string;
    }>;
    static install(fs: FileSystem, options: NPMSpawnOptions): Promise<void>;
    static packageScript(fs: FileSystem, script: string, options: NPMSpawnOptions): Promise<{
        cmd: any;
        args: any;
    }>;
    static dependencyScripts(cmd: string): Promise<string | null>;
}
