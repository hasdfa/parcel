export type IPCStatus = 'resolve' | 'reject' | 'progress';
export interface IPCInitOptions {
    esbuildVersion: string;
    workerUrl: string;
}
export interface OutputFile {
    readonly path: string;
    readonly contents: Uint8Array;
}
export type IPCRequest = TransformRequest | BuildRequest | NpmInstallRequest;
export type IPCResponse<Request extends IPCRequest = IPCRequest> = Request extends TransformRequest ? TransformResponse : Request extends BuildRequest ? BuildResponse : Request extends NpmInstallRequest ? NpmInstallResponse : TransformRequest & BuildRequest & NpmInstallRequest;
export interface TransformRequest {
    command_: 'transform';
    input_: string;
    options_: Record<string, any>;
}
export interface TransformResponse {
    code_?: string;
    map_?: string;
    mangleCache_?: Record<string, string | boolean>;
    legalComments_?: string;
    stderr_?: string;
    duration_?: number;
}
export interface BuildRequest {
    command_: 'build';
    input_: Record<string, string>;
    options_: Record<string, any>;
}
export interface NpmInstallRequest {
    command_: 'npm_install';
    registryBaseUrl_: string;
    input_: Record<string, string>;
    cwd_?: string;
}
export interface NpmInstallResponse {
}
export interface BuildResponse {
    outputFiles_?: OutputFile[];
    metafile_?: Record<string, any>;
    mangleCache_?: Record<string, string | boolean>;
    stderr_?: string;
    duration_?: number;
}
export declare function sendIPC<Request extends IPCRequest>(message: Request, progress?: (data: any) => void): Promise<IPCResponse<Request>>;
