declare module '@mischnic/dot-svg' {
  function dot(
    getWasmUrl: () => string,
  ): Promise<(dot: string) => Promise<string>>;
  export default dot;
}

declare module 'url:*' {
  const url: string;
  export default url;
}

declare module '@parcel/diagnostic' {
  export interface Diagnostic {
    type?: 'error' | 'warning' | 'info';
    source?: string;
    stack?: string;
    origin?: string;
    message?: string;
    codeFrames?: Array<{
      filePath?: string;
      code?: string;
      codeHighlights: Array<{
        message: string;
        start: {
          line: number;
          column: number;
        };
        end: {
          line: number;
          column: number;
        };
      }>;
    }>;
  }
}

// declare module '@parcel/fs' {
//   export class MemoryFS {
//     readFile(filePath: string, encoding: string): Promise<string>;
//     readFile(filePath: string): Promise<Buffer>;
//     writeFile(filePath: string, content: string | Buffer): Promise<void>;
//     exists(filePath: string): Promise<boolean>;
//     readdir(filePath: string): Promise<string[]>;
//     mkdirp(filePath: string): Promise<void>;
//   }

//   export class FSError extends Error {
//     constructor(code: string, message: string, ...args: any[]);
//   }

//   export const makeShared: {
//     id: string;
//   };

//   export interface File {
//     stat: any;
//     buffer: Buffer;
//   }

//   export interface FileSystem {
//     readFile(filePath: string, encoding: string): Promise<string>;
//   }
// }

declare module '@parcel/workers' {
  import EventEmitter from 'events';

  export default interface WorkerFarm extends EventEmitter {
    options: FarmOptions;
    warmWorkers: number;
    readyWorkers: number;
    workers: Map<number, Worker>;
    end(): void;
  }
}

declare module '@parcel/utils' {
  import {FileSystem} from './types/index';

  export function makeDeferredWithPromise<T>(): {
    promise: Promise<T>;
    deferred: {
      resolve: (value: T) => void;
      reject: (error: Error) => void;
    };
  };
  export class DefaultMap<K, V> extends Map<K, V> {
    constructor(defaultFn: () => V);
  }
  export function prettyDiagnostic(
    diagnostic: Diagnostic,
    options: {
      projectRoot: string;
      inputFS: FileSystem;
    },
    width: number,
    format: 'html' | 'text',
  ): {
    message: string;
    stack: string;
    codeframe: string;
    hints: Array<string>;
    documentation: string;
  };
}

// declare module '@parcel/types' {
//   export interface BuildSuccessEvent {
//     type: 'buildSuccess';
//     bundleGraph: any;
//     buildTime: number;
//     changedAssets: Map<string, any>;
//   }

//   export type FilePath = string;
//   export type DependencySpecifier = string;
//   export type SemverRange = string;
// }

// declare module '@parcel/package-manager' {
//   import {FilePath, DependencySpecifier, SemverRange} from '@parcel/types';

//   export interface ResolveResult {
//     resolved: string;
//     pkg: {
//       name: string;
//       version: string;
//       dependencies: Record<string, string>;
//       devDependencies: Record<string, string>;
//       pkgfile: string | null;
//       pkg: {
//         name: string;
//         version: string;
//       };
//     };
//   }

//   export interface Invalidations {
//     deleted: Set<string>;
//     added: Set<string>;
//   }

//   export interface PackageManager {
//     resolve(
//       name: DependencySpecifier,
//       from: FilePath,
//       range?: SemverRange
//     ): Promise<ResolveResult>;
//     getInvalidations(): Promise<Invalidations>;
//   }
// }

// declare module '@parcel/node-resolver-core' {
//   import {FileSystem} from '@parcel/fs';

//   export class ResolverBase {
//     constructor(options: {
//       fs: FileSystem;
//       projectRoot: string;
//       extensions: string[];
//       mainFields: string[];
//     });

//     resolve(options: {
//       filename: string;
//       specifier: string;
//       parent: {
//         filename: string;
//       };
//     }): Promise<{filePath: string} | null>;
//   }

//   export function init(): Promise<void>;
// }

// declare module '@parcel/bundler-default' {
//   const bundler: any;
//   export default bundler;
// }

// declare module '@parcel/compressor-raw' {
//   const compressor: any;
//   export default compressor;
// }

// declare module '@parcel/namer-default' {
//   const namer: any;
//   export default namer;
// }

// declare module '@parcel/optimizer-css' {
//   const optimizer: any;
//   export default optimizer;
// }

// declare module '@parcel/optimizer-terser' {
//   const optimizer: any;
//   export default optimizer;
// }

// declare module '@parcel/packager-css' {
//   const packager: any;
//   export default packager;
// }

// declare module '@parcel/packager-html' {
//   const packager: any;
//   export default packager;
// }

// declare module '@parcel/packager-js' {
//   const packager: any;
//   export default packager;
// }

// declare module '@parcel/packager-raw' {
//   const packager: any;
//   export default packager;
// }

// declare module '@parcel/reporter-json' {
//   const reporter: any;
//   export default reporter;
// }

// declare module '@parcel/reporter-dev-server-sw' {
//   const reporter: any;
//   export default reporter;
// }

// declare module '@parcel/resolver-default' {
//   const resolver: any;
//   export default resolver;
// }

// declare module '@parcel/resolver-repl-runtimes' {
//   const resolver: any;
//   export default resolver;
// }

// declare module '@parcel/runtime-browser-hmr' {
//   const runtime: any;
//   export default runtime;
// }

// declare module '@parcel/runtime-js' {
//   const runtime: any;
//   export default runtime;
// }

// declare module '@parcel/transformer-babel' {
//   const transformer: any;
//   export default transformer;
// }

// declare module '@parcel/transformer-css' {
//   const transformer: any;
//   export default transformer;
// }

// declare module '@parcel/transformer-html' {
//   const transformer: any;
//   export default transformer;
// }

// declare module '@parcel/transformer-inline-string' {
//   const transformer: any;
//   export default transformer;
// }

// declare module '@parcel/transformer-js' {
//   const transformer: any;
//   export default transformer;
// }

// declare module '@parcel/transformer-json' {
//   const transformer: any;
//   export default transformer;
// }

// declare module '@parcel/transformer-postcss' {
//   const transformer: any;
//   export default transformer;
// }

// declare module '@parcel/transformer-posthtml' {
//   const transformer: any;
//   export default transformer;
// }

// declare module '@parcel/transformer-raw' {
//   const transformer: any;
//   export default transformer;
// }

// declare module '@parcel/transformer-react-refresh-wrap' {
//   const transformer: any;
//   export default transformer;
// }

declare module '@mischnic/yarn-browser' {
  import {MemoryFS} from '@parcel/fs';

  interface RunOptions {
    dir: string;
    fs: MemoryFS;
    options: {
      npmRegistryServer: string;
    };
    progress: (msg: {
      type: string;
      displayName: string;
      indent: string;
      data: string;
    }) => void;
  }

  export function run(options: RunOptions): Promise<{
    report: {
      errorCount: number;
      reportedErrors: Array<any>;
    };
  }>;
}

declare global {
  import {WorkerFarm} from '@parcel/workers';

  interface GlobalThis {
    fs: FileSystem;
    workerFarm: WorkerFarm;
  }
}
