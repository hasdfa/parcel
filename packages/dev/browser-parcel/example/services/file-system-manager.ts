import { makeObservable, observable, action, computed } from 'mobx';
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

export class FileSystemManager implements BaseFileSystemManager {
  @observable.deep
  private projectFiles: ProjectFiles = {
    // [`${this.tmpDirPath}/.gitkeep`]: { contents: '' },
  };

  @observable.deep
  private currentWorkingDirectory: string = '/app';

  constructor(
    private readonly remote?: BaseFileSystemManager,
  ) {
    makeObservable(this);
  }

  public readonly cwd = () => {
    return this.currentWorkingDirectory;
  }

  public get tmpDirPath() {
    return '/tmp';
  }

  @action
  public readonly chdir = (path: string) => {
    this.currentWorkingDirectory = path;
    this.remote?.chdir(path);
  }

  @computed
  public get files(): ProjectFiles {
    return this.projectFiles;
  }

  @computed
  public get rawFiles(): Record<string, string> {
    return Object.fromEntries(Object.entries(this.projectFiles).map(([key, value]) => [key, value.contents]));
  }

  @computed
  public get fileNames() {
    return Object.keys(this.projectFiles);
  }

  public readonly exists = (path: string) => {
    return path in this.projectFiles;
  }

  public readonly isDirectory = (path: string) => {
    return this.fileNames.some(file => file.startsWith(path) && file.length > (path.length + 1));
  }

  @action
  public readonly setFiles = (files: ProjectFiles) => {
    this.projectFiles = {
      ...this.projectFiles,
      ...files,
    };
    this.remote?.setFiles(files);
  }

  @action
  public readonly writeFile = (path: string, contents: string) => {
    this.projectFiles[path] = {
      ...(this.projectFiles[path] || {}),
      contents,
    };
    this.remote?.writeFile(path, contents);
  }

  @action
  public readonly appendFile = (path: string, contents: string) => {
    this.writeFile(path, (this.projectFiles[path]?.contents || '') + contents);
    this.remote?.appendFile(path, contents);
  }

  @action
  public readonly deleteFile = (path: string) => {
    delete this.projectFiles[path];
    this.remote?.deleteFile(path);
  }

  public readonly readFile = (path: string) => {
    return this.projectFiles[path]?.contents || '';
  }

  public readonly readdir = (path: string) => {
    return this.fileNames.filter(file => file.startsWith(path));
  }

  public toSerializable() {
    const self = this;
    return {
      fs__cwd: self.cwd,
      fs__chdir: self.chdir,
      fs__exists: self.exists,
      fs__readdir: self.readdir,
      fs__isDirectory: self.isDirectory,
      fs__writeFile: self.writeFile,
      fs__appendFile: self.appendFile,
      fs__readFile: self.readFile,
      fs__deleteFile: self.deleteFile,
      fs__setFiles: self.setFiles,
    };
  }

  public static fromFiles(files: ProjectFiles, remoteFS?: BaseFileSystemManager) {
    const fs = new FileSystemManager(remoteFS);
    fs.setFiles(files);
    return fs;
  }

  public static fromSerializedRemote(remote: comlink.Remote<SerializableFileSystemManager>) {
    const fs = new FileSystemManager(unserializeFS(remote));
    return fs;
  }
}

function unserializeFS(fs: comlink.Remote<SerializableFileSystemManager>): BaseFileSystemManager {
  return new Proxy({}, {
    get(target: any, prop: string) {
      return (fs as any)[`fs__${prop}`];
    },
  }) as unknown as BaseFileSystemManager;
}
