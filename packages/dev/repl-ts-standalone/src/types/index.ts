import type {Readable, Writable} from 'stream';
import type {
  Event,
  Options as WatcherOptions,
  AsyncSubscription,
} from '@parcel/watcher';

export type Glob = string;
export type PackageName = string;
export type Semver = string;
export type SemverRange = string;
export type FilePath = string;
export type PackageDependencies = Record<PackageName, Semver>;

export type Engines = {
  readonly browsers?: string | Array<string>;
  readonly electron?: SemverRange;
  readonly node?: SemverRange;
  readonly parcel?: SemverRange;
};

/** In which environment the output should run (influces e.g. bundle loaders) */
export type EnvironmentContext =
  | 'browser'
  | 'web-worker'
  | 'service-worker'
  | 'worklet'
  | 'node'
  | 'electron-main'
  | 'electron-renderer';

/** The JS module format for the bundle output */
export type OutputFormat = 'esmodule' | 'commonjs' | 'global';

/** Corresponds to <code>pkg#targets.*.sourceMap</code> */
export type TargetSourceMapOptions = {
  readonly sourceRoot?: string;
  readonly inline?: boolean;
  readonly inlineSources?: boolean;
};

export type PackageTargetDescriptor = {
  readonly context?: EnvironmentContext;
  readonly engines?: Engines;
  readonly includeNodeModules?:
    | boolean
    | Array<PackageName>
    | Record<PackageName, boolean>;
  readonly outputFormat?: OutputFormat;
  readonly publicUrl?: string;
  readonly distDir?: FilePath;
  readonly sourceMap?: boolean | TargetSourceMapOptions;
  readonly isLibrary?: boolean;
  readonly optimize?: boolean;
  readonly scopeHoist?: boolean;
  readonly source?: FilePath | Array<FilePath>;
};

/**
 * Format of <code>package.json</code>
 */
export type PackageJSON = {
  name: PackageName;
  version: Semver;
  type?: 'module';
  main?: FilePath;
  module?: FilePath;
  types?: FilePath;
  browser?: FilePath | Record<FilePath, FilePath | boolean>;
  source?: FilePath | Array<FilePath>;
  alias?: {
    [key in PackageName | FilePath | Glob]?:
      | PackageName
      | FilePath
      | {
          global: string;
        };
  };
  browserslist?: Array<string> | Record<string, Array<string>>;
  engines?: Engines;
  targets?: Record<string, PackageTargetDescriptor>;
  dependencies?: PackageDependencies;
  devDependencies?: PackageDependencies;
  peerDependencies?: PackageDependencies;
  sideEffects?: boolean | FilePath | Array<FilePath>;
  bin?: string | Record<string, FilePath>;
};

export type FileOptions = {
  mode?: number;
};
export type ReaddirOptions =
  | {
      withFileTypes?: false;
    }
  | {
      withFileTypes: true;
    };
export interface Stats {
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
}
export type Encoding =
  | 'hex'
  | 'utf8'
  | 'utf-8'
  | 'ascii'
  | 'binary'
  | 'base64'
  | 'ucs2'
  | 'ucs-2'
  | 'utf16le'
  | 'latin1';
export interface FileSystem {
  readFile(filePath: FilePath): Promise<Buffer>;
  readFile(filePath: FilePath, encoding: Encoding): Promise<string>;
  readFileSync(filePath: FilePath): Buffer;
  readFileSync(filePath: FilePath, encoding: Encoding): string;
  writeFile(
    filePath: FilePath,
    contents: Buffer | string,
    options: FileOptions | null | undefined,
  ): Promise<void>;
  copyFile(
    source: FilePath,
    destination: FilePath,
    flags?: number,
  ): Promise<void>;
  stat(filePath: FilePath): Promise<Stats>;
  statSync(filePath: FilePath): Stats;
  lstat(filePath: FilePath): Promise<Stats>;
  lstatSync(filePath: FilePath): Stats;
  readdir(
    path: FilePath,
    opts?: {
      withFileTypes?: false;
    },
  ): Promise<FilePath[]>;
  readdir(
    path: FilePath,
    opts: {
      withFileTypes: true;
    },
  ): Promise<Dirent[]>;
  readdirSync(
    path: FilePath,
    opts?: {
      withFileTypes?: false;
    },
  ): FilePath[];
  readdirSync(
    path: FilePath,
    opts: {
      withFileTypes: true;
    },
  ): Dirent[];
  symlink(target: FilePath, path: FilePath): Promise<void>;
  unlink(path: FilePath): Promise<void>;
  realpath(path: FilePath): Promise<FilePath>;
  realpathSync(path: FilePath): FilePath;
  readlink(path: FilePath): Promise<FilePath>;
  readlinkSync(path: FilePath): FilePath;
  exists(path: FilePath): Promise<boolean>;
  existsSync(path: FilePath): boolean;
  mkdirp(path: FilePath): Promise<void>;
  rimraf(path: FilePath): Promise<void>;
  ncp(source: FilePath, destination: FilePath): Promise<void>;
  createReadStream(
    path: FilePath,
    options?: FileOptions | null | undefined,
  ): Readable;
  createWriteStream(
    path: FilePath,
    options?: FileOptions | null | undefined,
  ): Writable;
  cwd(): FilePath;
  chdir(dir: FilePath): void;
  watch(
    dir: FilePath,
    fn: (err: Error | null | undefined, events: Array<Event>) => unknown,
    opts: WatcherOptions,
  ): Promise<AsyncSubscription>;
  getEventsSince(
    dir: FilePath,
    snapshot: FilePath,
    opts: WatcherOptions,
  ): Promise<Array<Event>>;
  writeSnapshot(
    dir: FilePath,
    snapshot: FilePath,
    opts: WatcherOptions,
  ): Promise<void>;
  findAncestorFile(
    fileNames: Array<string>,
    fromDir: FilePath,
    root: FilePath,
  ): FilePath | null | undefined;
  findNodeModule(
    moduleName: string,
    fromDir: FilePath,
  ): FilePath | null | undefined;
  findFirstFile(filePaths: Array<FilePath>): FilePath | null | undefined;
}
// https://nodejs.org/api/fs.html#fs_class_fs_dirent
export interface Dirent {
  readonly name: string;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isDirectory(): boolean;
  isFIFO(): boolean;
  isFile(): boolean;
  isSocket(): boolean;
  isSymbolicLink(): boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFunction = (level: LogLevel, ...args: any[]) => void;
