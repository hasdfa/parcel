import type { FileSystem } from '../types';
export interface NPMSpawnOptions {
    cwd?: string;
    reported?: (type: 'error' | 'info', message: string) => void;
    dependencies?: Record<string, string>;
    registryBaseUrl: string;
}
export declare class NPMInstaller {
    private static scriptsMap;
    private static getPackageJson;
    static install(fs: FileSystem, options: NPMSpawnOptions): Promise<void>;
    static packageScript(fs: FileSystem, script: string, options: NPMSpawnOptions): Promise<{
        cmd: any;
        args: any;
    }>;
    static dependencyScripts(cmd: string): Promise<string | null>;
}
