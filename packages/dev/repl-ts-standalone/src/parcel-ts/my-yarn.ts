// import { openDB } from 'https://esm.sh/idb';
// import { Buffer } from 'https://esm.sh/buffer';

import type {FileSystem} from '../types/index';
import {openDB} from 'idb';
import msgpack from 'msgpack-lite';
import path from 'path';

async function fetchWithRetry(
  input: string,
  init?: RequestInit,
  retries = 3,
  delay = 1000,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    await new Promise<Response>(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(input, init, retries - 1, delay);
  }
}

const sandpackClient = {
  async resolvePackages(
    registryBaseUrl: string,
    packages: Record<string, string>,
  ) {
    const dependenciesRequest = Object.entries(packages).map(
      ([name, version]) => `${name}@${version}`,
    );
    const dependeciesBase64 = Buffer.from(
      dependenciesRequest.join(';'),
    ).toString('base64');
    const requestPath = `/v2/deps/${dependeciesBase64}`;

    const response = await fetchWithRetry(`${registryBaseUrl}${requestPath}`);
    const responseBytes = await response.bytes();

    const distTags: Record<string, string> = msgpack.decode(responseBytes);
    const resolvedPackages = Object.fromEntries(
      Object.entries(distTags).map(([name, version]) => [
        name.split('@').slice(0, -1).join('@'),
        version,
      ]),
    );

    return resolvedPackages;
  },
  async downloadPackageFiles(
    registryBaseUrl: string,
    packageName: string,
    packageVersion: string,
  ) {
    // const packageRequest = Buffer.from(`${packageName}@${packageVersion}`).toString('base64');
    // const response = await fetchWithRetry(`${registryBaseUrl}/v2/mod/${packageRequest}`);
    // const responseBytes = await response.bytes();
    // const files: Record<string, Buffer> = msgpack.decode(responseBytes);
    // return files;

    const packageRequest = Buffer.from(
      `${packageName}@${packageVersion}`,
    ).toString('base64');
    const requestPath = `/v2/mod/${packageRequest}`;

    return Cache.withCacheData(
      requestPath,
      async () => {
        const response = await fetchWithRetry(
          `${registryBaseUrl}${requestPath}`,
        );
        const responseBytes = await response.bytes();
        return responseBytes;
      },
      async responseBytes => {
        const files: Record<string, Buffer> = msgpack.decode(responseBytes);
        return files;
      },
    );
  },
};

function measureTime(): () => string {
  const startTime = Date.now();
  return () => {
    const endTime = Date.now();
    let durationMs = endTime - startTime;
    return durationMs > 1000
      ? `${Math.round(durationMs / 1000)}s ${durationMs % 1000}ms`
      : `${durationMs}ms`;
  };
}

// function getPackageCachePath(packageName: string, packageVersion: string) {
//   return path.join(YARN_CACHE_DIR, btoa(`${packageName}@${packageVersion}`));
// }

export interface SpawnOptions {
  cwd?: string;
  reported?: (type: 'error' | 'info', message: string) => void;
  dependencies?: Record<string, string>;

  // URL of your deployment of sandpack-cdn
  registryBaseUrl: string;
}

export class PackageManager {
  private static scriptsMap: Record<string, string> = {};

  private static async getPackageJson(fs: FileSystem, options: SpawnOptions) {
    const packageJsonPath = path.join(
      options?.cwd || process.cwd(),
      'package.json',
    );
    const content = await fs
      .readFile(packageJsonPath, 'utf8')
      .catch(() => null);
    return content ? JSON.parse(content) : null;
  }

  public static async install(fs: FileSystem, options: SpawnOptions) {
    const log = options.reported ?? (() => {});

    const installTime = measureTime();
    const packageJson = await this.getPackageJson(fs, options);
    const cwd = options?.cwd || '/';

    const restoreTime = measureTime();
    log('info', `[YN0000] ┌ Restoring cache`);
    // const cacheDir = path.join(cwd, 'node_modules');
    // await Cache.restoreCache(fs, cacheDir);
    // await Cache.restoreLockfile(fs, cwd);
    log('info', `[YN0000] └ Completed in ${restoreTime()}`);

    const allDependencies = {
      ...(packageJson?.dependencies || {}),
      ...(packageJson?.devDependencies || {}),
      ...(packageJson?.peerDependencies || {}),
      ...(options?.dependencies || {}),
    };

    const nodeModulesPath = path.join(cwd, 'node_modules');
    const scriptsPath = path.join(nodeModulesPath, '.scripts.json');
    if (!fs.existsSync(nodeModulesPath)) {
      await fs.mkdirp(nodeModulesPath);
    }

    const resolutionTime = measureTime();
    log('info', `[YN0000] ┌ Resolution step`);
    const packages = await sandpackClient.resolvePackages(
      options.registryBaseUrl,
      allDependencies,
    );
    log('info', `[YN0000] └ Completed in ${resolutionTime()}`);

    const scripts: Record<string, string> = {
      ...(await fs
        .readFile(scriptsPath, 'utf8')
        .then(JSON.parse)
        .catch(() => {})),
    };
    // const dirsToLink: [string, string][] = [];

    const fetchTime = measureTime();
    log('info', `[YN0000] ┌ Fetch step`);
    await Promise.all(
      Object.entries(packages).map(async ([packageName, packageVersion]) => {
        const packagePath = path.join(nodeModulesPath, packageName);
        // const cachePath = getPackageCachePath(packageName, packageVersion);
        const cachePath = packagePath;
        // dirsToLink.push([packagePath, cachePath]);

        if (fs.existsSync(cachePath)) {
          log(
            'info',
            `[YN0013] │ ${packageName}@npm:${packageVersion} found in the cache`,
          );
        } else {
          log(
            'info',
            `[YN0013] │ ${packageName}@npm:${packageVersion} can't be found in the cache and will be fetched from the remote registry`,
          );
          const files = await sandpackClient.downloadPackageFiles(
            options.registryBaseUrl,
            packageName,
            packageVersion,
          );

          for (const [baseFilePath, fileContent] of Object.entries(files)) {
            const filePath = path.join(cachePath, baseFilePath);
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) {
              await fs.mkdirp(dirPath);
            }
            await fs.writeFile(filePath, fileContent, undefined);
          }
        }

        // TODO: gather "scripts" from all deps package.json
        const pkgJsonText = await fs
          .readFile(path.join(cachePath, 'package.json'), 'utf8')
          .catch(() => null);
        const pkgJson = pkgJsonText ? JSON.parse(pkgJsonText) : null;
        if (pkgJson && pkgJson.bin) {
          if (typeof pkgJson.bin === 'string') {
            scripts[pkgJson.name] = path.resolve(
              packagePath,
              pkgJson.bin as string,
            );
          } else if (typeof pkgJson.bin === 'object') {
            Object.entries(pkgJson.bin).forEach(([name, bin]) => {
              scripts[name] = path.resolve(packagePath, bin as string);
            });
          }
        } else if (pkgJson && pkgJson.main) {
          scripts[pkgJson.name] = path.resolve(
            packagePath,
            pkgJson.main as string,
          );
        }
      }),
    );
    // await Cache.saveCache(fs, cacheDir);
    log('info', `[YN0000] └ Completed in ${fetchTime()}`);

    const linkTime = measureTime();
    log('info', `[YN0000] ┌ Link step`);

    // Store scripts
    this.scriptsMap = scripts;
    await fs.writeFile(
      scriptsPath,
      JSON.stringify(scripts, null, 2),
      undefined,
    );

    // Link packages
    // for (const [packagePath, cachePath] of dirsToLink) {
    //   await fs.mkdirp(path.dirname(packagePath));
    //   const pkgStats = await fs.stat(packagePath).catch(() => null);
    //   if (pkgStats) {
    //     await fs.unlink(packagePath).catch(() => {});
    //     await fs.rimraf(packagePath).catch(() => {});
    //   }
    //   fs.symlink(cachePath, packagePath);
    // }

    log('info', `[YN0000] └ Completed in ${linkTime()}`);
    log('info', `[YN0000] Done in ${installTime()}`);
  }

  public static async packageScript(
    fs: FileSystem,
    script: string,
    options: SpawnOptions,
  ) {
    const packageJson = await this.getPackageJson(fs, options);
    const scripts = packageJson?.scripts;
    const scriptPath = scripts?.[script];
    const [cmd, ...args] = scriptPath?.split(' ') || [];
    return {cmd, args};
  }

  // E.g. to found source file for `next` script
  public static async dependencyScripts(cmd: string) {
    const scriptPath = this.scriptsMap[cmd];
    return scriptPath || null;
  }
}

const IDB_DB_YARN = 'REPL-yarn-cache';
const IDB_STORE_CACHE = 'cache';
const IDB_STORE_LOCK = 'lockfile';
const IDB_STORE_SANDPACK_CDN = 'sandpack-cdn';
const IDB_CACHE_VERSION = 1;

function getDB() {
  return openDB(IDB_DB_YARN, IDB_CACHE_VERSION, {
    upgrade(db) {
      const cache = db.createObjectStore(IDB_STORE_CACHE, {keyPath: 'name'});
      cache.createIndex('lastUsed', 'lastUsed', {unique: false});

      db.createObjectStore(IDB_STORE_LOCK, {keyPath: 'name'});

      db.createObjectStore(IDB_STORE_SANDPACK_CDN, {keyPath: 'request'});
    },
    blocked() {},
    blocking() {},
    terminated() {},
  });
}

// const YARN_CACHE_DIR = '/.yarn/cache';
// const YARN_CACHE_STALE = /* 7 Days: */ 7 * 24 * 60 * 60 * 1000;

const Cache = {
  async withCacheData<T, R>(
    request: string,
    getData: () => Promise<T>,
    transform: (data: T) => Promise<R>,
  ): Promise<R> {
    const db = await getDB();
    const cachedData = await db.get(IDB_STORE_SANDPACK_CDN, request);
    if (cachedData && cachedData.data) {
      return transform(cachedData.data);
    }

    const data = await getData();
    await db.put(IDB_STORE_SANDPACK_CDN, {request, data});
    return transform(data);
  },
  // async savePartialCache(basePath: string, files: Record<string, Buffer>) {
  //   const db = await getDB();
  //   let time = Date.now();
  //   // await db.clear(IDB_STORE_CACHE);
  //   {
  //     const tx = db.transaction(IDB_STORE_CACHE, 'readwrite');
  //     await Promise.all([
  //       ...Object.entries(files).map(([name, data]) =>
  //         data && tx.store.put({
  //           name: path.join(basePath, name),
  //           lastUsed: time,
  //           data,
  //         }).catch(() => {}),
  //       ),
  //       tx.done,
  //     ]);
  //   }
  // },
  // async saveCache(fs: FileSystem, cacheDir: string) {
  //   const files = await Promise.all(
  //     (await fs.readdir(cacheDir))
  //       .map(async name => [
  //         name,
  //         (await fs.readFile(cacheDir + '/' + name).catch(() => null)),
  //       ])
  //   );

  //   const db = await getDB();
  //   let time = Date.now();
  //   // await db.clear(IDB_STORE_CACHE);
  //   {
  //     const tx = db.transaction(IDB_STORE_CACHE, 'readwrite');
  //     // await tx.store.clear();
  //     await Promise.all([
  //       ...files.map(([name, data]) =>
  //         data && tx.store.put({
  //           name,
  //           lastUsed: time,
  //           data,
  //         }).catch(() => {}),
  //       ),
  //       tx.done,
  //     ]);
  //   }
  // },
  // async restoreCache(fs: FileSystem, cacheDir: string) {
  //   await fs.mkdirp(cacheDir);
  //   const db = await getDB();
  //   for (let { name, data } of await db.getAll(IDB_STORE_CACHE)) {
  //     await fs.writeFile(
  //       path.join(cacheDir, name),
  //       Buffer.from(data),
  //       undefined,
  //     );
  //   }
  // },
  // async saveLockfile(fs: FileSystem, baseDir: string) {
  //   const data = await fs.readFile(path.join(baseDir, 'yarn.lock'));

  //   const db = await getDB();
  //   await db.put(IDB_STORE_LOCK, {
  //     name: 'yarn.lock',
  //     data,
  //   });
  // },
  // async restoreLockfile(fs: FileSystem, baseDir: string) {
  //   const db = await getDB();
  //   const result = await db.get(IDB_STORE_LOCK, 'yarn.lock');
  //   if (result) {
  //     await fs.writeFile(path.join(baseDir, 'yarn.lock'), Buffer.from(result.data), undefined);
  //   }
  // },
};
