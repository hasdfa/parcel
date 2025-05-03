import type { FileSystem, LogFunction } from '../../types';
export interface NPMSpawnOptions {
    cwd?: string;
    dependencies?: Record<string, string>;
    registryBaseUrl: string;
}
export declare class NPMInstaller {
    private static scriptsMap;
    private static cwd;
    private static getPackageJson;
    static install(fs: FileSystem, options: NPMSpawnOptions, _log?: LogFunction): Promise<void>;
    static packageScript(fs: FileSystem, script: string, options: NPMSpawnOptions): Promise<{
        cmd: any;
        args: any;
    }>;
    static dependencyScripts(cmd: string): Promise<string | null>;
}
