import type { FilePath, DependencySpecifier, SemverRange } from '@parcel/types';
import type { FileSystem } from '@parcel/fs';
import type { PackageManager, Invalidations, ResolveResult } from '@parcel/package-manager';
import type { Resolver } from '@parcel/rust';
export declare const BUILTINS: {
    '@parcel/bundler-default': any;
    '@parcel/compressor-raw': any;
    '@parcel/namer-default': any;
    '@parcel/optimizer-css': any;
    '@parcel/optimizer-terser': any;
    '@parcel/packager-css': any;
    '@parcel/packager-html': any;
    '@parcel/packager-js': any;
    '@parcel/packager-raw': any;
    '@parcel/reporter-json': any;
    '@parcel/resolver-default': any;
    '@parcel/resolver-repl-runtimes': any;
    '@parcel/runtime-browser-hmr': any;
    '@parcel/runtime-js': any;
    '@parcel/transformer-babel': any;
    '@parcel/transformer-css': any;
    '@parcel/transformer-html': any;
    '@parcel/transformer-inline-string': any;
    '@parcel/transformer-js': any;
    '@parcel/transformer-json': any;
    '@parcel/transformer-postcss': any;
    '@parcel/transformer-posthtml': any;
    '@parcel/transformer-raw': any;
    '@parcel/transformer-react-refresh-wrap': any;
};
export declare class BrowserPackageManager implements PackageManager {
    resolver: Resolver | null;
    fs: FileSystem;
    projectRoot: FilePath;
    cache: Map<DependencySpecifier, ResolveResult>;
    constructor(fs: FileSystem, projectRoot: FilePath);
    getResolver(): Promise<Resolver>;
    static deserialize(opts: any): BrowserPackageManager;
    serialize(): {
        $$raw: boolean;
        fs: FileSystem;
        projectRoot: FilePath;
    };
    require(name: DependencySpecifier, from: FilePath, opts?: {
        range?: SemverRange | null;
        shouldAutoInstall?: boolean;
        saveDev?: boolean;
    } | null): Promise<any>;
    resolve(name: DependencySpecifier, from: FilePath, options?: {
        range?: SemverRange | null;
        shouldAutoInstall?: boolean;
        saveDev?: boolean;
    } | null): Promise<ResolveResult>;
    getInvalidations(): Invalidations;
    invalidate(): void;
}
