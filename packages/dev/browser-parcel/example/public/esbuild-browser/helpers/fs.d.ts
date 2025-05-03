export declare let stderrSinceReset: string;
export declare function resetFileSystem(files: Record<string, string>): void;
export declare function setFilesBulk(files: Record<string, string>): void;
declare global {
    var fs: unknown;
}
