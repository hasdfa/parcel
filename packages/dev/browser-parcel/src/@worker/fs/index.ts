import path from 'path';
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

export function createParcelFS(initPromise: Ref<PromiseLike<{ fs: FileSystem }>>): RemoteFileSystemManager {
  const withFS = async <T>(fn: (fs: FileSystem) => Promise<T> | T): Promise<T> => {
    console.trace('withFS');
    const { fs } = await initPromise.current;
    return await fn(fs);
  }

  return {
    fs__cwd: () => withFS(fs => fs.cwd()),
    fs__chdir: (filePath: string) => withFS(fs => fs.chdir(filePath)),
    fs__exists: (filePath: string) => withFS(fs => fs.exists(filePath)),
    fs__isDirectory: (filePath: string) => withFS(fs => fs.stat(filePath).then(stat => stat.isDirectory())),
    fs__writeFile: (filePath: string, contents: string) => withFS(async fs => {
      await fs.mkdirp(path.dirname(filePath));
      return fs.writeFile(filePath, contents, undefined);
    }),
    fs__appendFile: (filePath: string, contents: string) => withFS(async fs => {
      const existing = await fs.readFile(filePath, 'utf8').catch(() => '');
      await fs.mkdirp(path.dirname(filePath));
      return fs.writeFile(filePath, existing + contents, undefined);
    }),
    fs__readFile: (filePath: string) => withFS(fs => fs.readFileSync(filePath, 'utf8')),
    fs__deleteFile: (filePath: string) => withFS(fs => fs.unlink(filePath)),
    fs__setFiles: (files: ProjectFiles) => withFS(async fs => {
      for (const [filePath, file] of Object.entries(files)) {
        await fs.mkdirp(path.dirname(filePath));
        await fs.writeFile(filePath, file.contents, undefined);
      }
    }),
    fs__readdir: (filePath: string) => withFS(fs => fs.readdir(filePath)),
  }
}