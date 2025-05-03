import * as comlink from 'comlink';
export interface ProjectFile {
    contents: string;
    isEntry?: boolean;
    jsEntry?: boolean;
}
export type ProjectFiles = Record<string, ProjectFile>;
export interface BaseFileSystemManager {
    tmpDirPath: string;
    cwd: () => string;
    chdir: (path: string) => void;
    exists: (path: string) => boolean;
    isDirectory: (path: string) => boolean;
    writeFile: (path: string, contents: string) => void;
    appendFile: (path: string, contents: string) => void;
    readFile: (path: string) => string;
    deleteFile: (path: string) => void;
    setFiles: (files: ProjectFiles) => void;
    readdir: (path: string) => string[];
}
export type SerializableFileSystemManager = ReturnType<FileSystemManager['toSerializable']>;
export declare class FileSystemManager implements BaseFileSystemManager {
    private readonly remote?;
    private projectFiles;
    private currentWorkingDirectory;
    constructor(remote?: BaseFileSystemManager | undefined);
    readonly cwd: () => string;
    get tmpDirPath(): string;
    readonly chdir: (path: string) => void;
    get files(): ProjectFiles;
    get rawFiles(): Record<string, string>;
    get fileNames(): string[];
    readonly exists: (path: string) => boolean;
    readonly isDirectory: (path: string) => boolean;
    readonly setFiles: (files: ProjectFiles) => void;
    readonly writeFile: (path: string, contents: string) => void;
    readonly appendFile: (path: string, contents: string) => void;
    readonly deleteFile: (path: string) => void;
    readonly readFile: (path: string) => string;
    readonly readdir: (path: string) => string[];
    toSerializable(): {
        fs__cwd: () => string;
        fs__chdir: (path: string) => void;
        fs__exists: (path: string) => boolean;
        fs__readdir: (path: string) => string[];
        fs__isDirectory: (path: string) => boolean;
        fs__writeFile: (path: string, contents: string) => void;
        fs__appendFile: (path: string, contents: string) => void;
        fs__readFile: (path: string) => string;
        fs__deleteFile: (path: string) => void;
        fs__setFiles: (files: ProjectFiles) => void;
    };
    static fromFiles(files: ProjectFiles, remoteFS?: BaseFileSystemManager): FileSystemManager;
    static fromSerializedRemote(remote: comlink.Remote<SerializableFileSystemManager>): FileSystemManager;
}
