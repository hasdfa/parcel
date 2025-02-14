import type {FileSystem} from '../types/index';
import {openDB} from 'idb';
import {Buffer} from 'buffer';

// @ts-ignore
import {run} from '@mischnic/yarn-browser';

type DependenciesMap = Record<string, string>;
type DependenciesList = Array<[string, string]>;

let previousDependencies: DependenciesList;
function shouldRunYarn(
  oldDeps: DependenciesList | undefined,
  newDeps: DependenciesList,
) {
  if (oldDeps) {
    if (oldDeps.length !== newDeps.length) return true;
    else if (newDeps.length === 0) return false;
    for (let i = 0; i < newDeps.length; i++) {
      let [nameOld, versionOld] = oldDeps[i];
      let [nameNew, versionNew] = newDeps[i];
      if (nameOld !== nameNew || versionOld !== versionNew) {
        return true;
      }
    }
    return false;
  } else {
    return newDeps.length > 0;
  }
}

export async function yarnInstall(
  dependencies: DependenciesMap | null | undefined,
  fs: FileSystem,
  dir: string,
  progress: (args: {
    type: string;
    displayName: string;
    indent: string;
    data: string;
  }) => void,
  options?: {
    ignorePackageJson?: boolean;
  },
) {
  let dependenciesList: DependenciesList = Object.entries(dependencies || {});
  if (
    !options?.ignorePackageJson &&
    (await fs.exists('/app/package.json').catch(() => false))
  ) {
    let pkg = await fs.readFile('/app/package.json', 'utf8');
    let deps = JSON.parse(pkg).dependencies;
    if (deps) {
      dependenciesList = Object.entries({
        ...dependencies,
        ...deps,
      }) as Array<[string, string]>;
    }
  }

  console.log('[debug] yarn-install', dependenciesList);
  if (shouldRunYarn(previousDependencies, dependenciesList)) {
    await fs.mkdirp('/tmp');
    await Cache.restoreLockfile(fs);
    await Cache.restoreCache(fs);
    let {report} = await run({
      dir,
      fs,
      options: {
        npmRegistryServer: 'registry.npmjs.org',
      },
      progress(v) {
        let {type, indent, data, displayName} = v;
        console.debug(
          `%c[${displayName}] ${indent} ${data}`,
          `font-family: monospace;${type === 'error' ? 'color: red;' : ''}`,
        );
        progress(v);
      },
    });
    if (report.errorCount > 0) {
      throw [...report.reportedErrors][0] ?? new Error('Yarn install failed');
    }
    console.debug(report);
    await Cache.saveLockfile(fs);
    await Cache.saveCache(fs);

    console.log('[debug] yarn-install::success');
  } else {
    console.log('[debug] yarn-install::skipped');
  }

  previousDependencies = dependenciesList;
}

const IDB_DB_YARN = 'PARCEL-REPL-yarn-cache';
const IDB_STORE_CACHE = 'cache';
const IDB_STORE_LOCK = 'lockfile';
const IDB_CACHE_VERSION = 1;

function getDB() {
  return openDB(IDB_DB_YARN, IDB_CACHE_VERSION, {
    upgrade(db) {
      let cache = db.createObjectStore(IDB_STORE_CACHE, {
        keyPath: 'name',
      });
      cache.createIndex('lastUsed', 'lastUsed', {unique: false});

      db.createObjectStore(IDB_STORE_LOCK, {
        keyPath: 'name',
      });
    },
    blocked() {},
    blocking() {},
    terminated() {},
  });
}

const YARN_CACHE_DIR = '/app/.yarn/cache';
const YARN_LOCKFILE = '/app/yarn.lock';
// const YARN_CACHE_STALE = /* 7 Days: */ 7 * 24 * 60 * 60 * 1000;
const Cache = {
  async saveCache(fs: FileSystem) {
    const files = (await fs.readdir(YARN_CACHE_DIR)).map(name => [
      name,
      fs.readFileSync(YARN_CACHE_DIR + '/' + name),
    ]);

    const db = await getDB();
    let time = Date.now();
    await db.clear(IDB_STORE_CACHE);
    {
      const tx = db.transaction(IDB_STORE_CACHE, 'readwrite');
      // await tx.store.clear();
      await Promise.all([
        ...files.map(([name, data]) =>
          tx.store.put({
            name,
            lastUsed: time,
            data,
          }),
        ),
        tx.done,
      ]);
    }
    // {
    //   const tx = db.transaction(IDB_STORE_CACHE, 'readwrite');
    //   let oldEntries = await (await tx.store.index('lastUsed')).getAll(
    //     // $FlowFixMe
    //     IDBKeyRange.upperBound(time - YARN_CACHE_STALE),
    //   );
    //   if (oldEntries.length > 0) {
    //     console.log(`Purging cache, deleting ${oldEntries.length} packages`);
    //   }
    //   await Promise.all([
    //     ...oldEntries.map(({name}) => tx.store.delete(name)),
    //     tx.done,
    //   ]);
    // }
  },
  async restoreCache(fs: FileSystem) {
    await fs.mkdirp(YARN_CACHE_DIR);
    const db = await getDB();
    for (let {name, data} of await db.getAll(IDB_STORE_CACHE)) {
      console.debug('Restored from Yarn cache:', YARN_CACHE_DIR + '/' + name);
      await fs.writeFile(
        YARN_CACHE_DIR + '/' + name,
        Buffer.from(data),
        undefined,
      );
    }
  },

  async saveLockfile(fs: FileSystem) {
    const data = await fs.readFile(YARN_LOCKFILE);

    const db = await getDB();
    await db.put(IDB_STORE_LOCK, {
      name: 'yarn.lock',
      data,
    });
  },
  async restoreLockfile(fs: FileSystem) {
    const db = await getDB();
    const result = await db.get(IDB_STORE_LOCK, 'yarn.lock');
    if (result) {
      await fs.writeFile(YARN_LOCKFILE, Buffer.from(result.data), undefined);
    }
  },
};
