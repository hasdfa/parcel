import type { FileSystem, Ref } from '../../types';
export interface ProjectFiles {
    [key: string]: {
        contents: string;
        isEntry?: boolean;
    };
}
export interface RemoteFileSystemManager {
    fs__cwd: () => Promise<string>;
    fs__chdir: (filePath: string) => Promise<void>;
    fs__exists: (filePath: string) => Promise<boolean>;
    fs__isDirectory: (filePath: string) => Promise<boolean>;
    fs__writeFile: (filePath: string, contents: string) => Promise<void>;
    fs__appendFile: (filePath: string, contents: string) => Promise<void>;
    fs__readFile: (filePath: string) => Promise<string>;
    fs__deleteFile: (filePath: string) => Promise<void>;
    fs__setFiles: (files: ProjectFiles) => Promise<void>;
    fs__readdir: (filePath: string) => Promise<string[]>;
}
export declare function createParcelFS(initPromise: Ref<PromiseLike<{
    fs: FileSystem;
}>>): RemoteFileSystemManager;
