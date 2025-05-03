/// <reference types="node" />
/// <reference types="node" />
import type { FilePath } from '@parcel/types';
import { MemoryFS, File } from '@parcel/fs';
interface OpenFD {
    filePath: FilePath;
    file: File;
    position: number;
}
/**
 * Can be used as a standin for the npm `require("fs")` package because `MemoryFS` not API compatible.
 */
export declare class ExtendedMemoryFS extends MemoryFS {
    openFDs: Map<number, OpenFD>;
    nextFD: number;
    _mkdir(dir: FilePath, options?: {
        recursive?: boolean;
    }): Promise<void>;
    _rmdir(filePath: FilePath, options?: {
        recursive?: boolean;
    }): Promise<void>;
    rmdir(...args: any[]): any;
    mkdir(...args: any[]): any;
    readdir(...args: any[]): any;
    unlink(...args: any[]): any;
    copyFile(...args: any[]): any;
    realpath(...args: any[]): any;
    readFile(...args: any[]): any;
    symlink(...args: any[]): any;
    writeFile(...args: any[]): any;
    stat(...args: any[]): any;
    lstat(...args: any[]): any;
    lstatSync(filePath: FilePath): any;
    exists(filePath: FilePath, cb?: (exists: boolean) => void): any;
    chmodSync(): void;
    renameSync(oldPath: FilePath, newPath: FilePath): void;
    _nextFD(path: FilePath): number;
    openSync(filePath: FilePath, flags: number | string, mode: number): number;
    readSync(fdNum: number, buffer: Buffer, offset: any, length: any, position: any): number;
    writeSync(fdNum: number, buffer: Buffer | string, offset: any, length: any, position: any): number;
    closeSync(fd: number): void;
    fstatSync(fdNum: number): any;
    open(...args: any[]): any;
    read(...args: any[]): any;
    write(...args: any[]): any;
    close(...args: any[]): any;
    fstat(...args: any[]): any;
    rename(...args: any[]): any;
    chmod(...args: any[]): any;
}
export {};
