"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  initWorker: () => initWorker
});
module.exports = __toCommonJS(index_exports);

// src/global.ts
var value = {
  ready: false,
  status: "",
  reload: {
    esbuildVersion: "",
    workerUrl: ""
  }
};
var listeners = {};
function emit(event, value2) {
  if (listeners[event]) {
    listeners[event].forEach((listener) => listener(value2));
  }
}
var emitter = {
  set ready(v) {
    value.ready = v;
    emit("ready", v);
  },
  set reload(v) {
    value.reload = v;
    emit("reload", v);
  },
  set status(v) {
    value.status = v;
    emit("status", v);
  },
  get ready() {
    return value.ready;
  },
  get reload() {
    return value.reload;
  },
  get status() {
    return value.status;
  },
  on: (event, callback) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(callback);
  }
};

// src/ipc.ts
var workerText = null;
var activeTask = null;
var pendingTask = null;
var waitingPromise = {};
var on_reload = async () => null;
emitter.on("reload", (options) => on_reload(options));
var workerPromise = new Promise((resolve, reject) => {
  on_reload = (options) => {
    const reloadPromise = reloadWorker(options);
    reloadPromise.then(resolve, reject);
    on_reload = (options2) => {
      workerPromise.then((worker) => worker.terminate());
      workerPromise = reloadWorker(options2);
      return workerPromise;
    };
    return reloadPromise;
  };
});
var do_fetch = (url, options) => {
  emitter.status = `Fetching ${url}`;
  return fetch(url, options);
};
async function packageFetch(subpath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("Timeout"), 5e3);
  try {
    const response = await do_fetch(`https://cdn.jsdelivr.net/npm/${subpath}`);
    if (response.ok) {
      clearTimeout(timeout);
      return response;
    }
  } catch (err) {
    console.error(err);
  }
  return do_fetch(`https://unpkg.com/${subpath}`);
}
async function reloadWorker(options) {
  const { esbuildVersion: version, workerUrl } = options;
  let loadingFailure;
  emitter.status = `Loading esbuild ${version}\u2026`;
  try {
    if (activeTask) activeTask.abort_();
    if (pendingTask) pendingTask.abort_();
    activeTask = null;
    pendingTask = null;
    const [major, minor, patch] = version.split(".").map((x) => +x);
    const min = major === 0 && (minor < 8 || minor === 8 && patch < 33) ? "" : ".min";
    const [workerJS, esbuildJS, esbuildWASM] = await Promise.all([
      workerText || (workerText = fetch(workerUrl).then((r) => r.text())),
      packageFetch(`esbuild-wasm@${version}/lib/browser${min}.js`).then((r) => r.text()),
      packageFetch(`esbuild-wasm@${version}/esbuild.wasm`).then((r) => r.arrayBuffer())
    ]);
    setupLocal(esbuildJS, esbuildWASM.slice(0));
    const i = workerJS.lastIndexOf("//# sourceMappingURL=");
    const workerJSWithoutSourceMap = i >= 0 ? workerJS.slice(0, i) : workerJS;
    const parts = [esbuildJS, `
var polywasm=1;`, workerJSWithoutSourceMap];
    const url = URL.createObjectURL(new Blob(parts, { type: "application/javascript" }));
    return await new Promise((resolve, reject) => {
      const worker = new Worker(url, { type: "module" });
      worker.onmessage = (e) => {
        worker.onmessage = null;
        if (e.data[0] === "success") {
          resolve(worker);
          worker.onmessage = (e2) => {
            var _a, _b;
            if (e2.data && Array.isArray(e2.data) && e2.data.length === 3 && waitingPromise[e2.data[0]]) {
              const [id, status, data] = e2.data;
              (_b = (_a = waitingPromise[id]) == null ? void 0 : _a[status]) == null ? void 0 : _b.call(_a, data);
              if (["resolve", "reject"].includes(status)) {
                delete waitingPromise[id];
              }
            }
          };
          console.debug("resolve", worker);
          emitter.status = "Loaded esbuild " + version;
          emitter.ready = true;
        } else {
          console.debug("reject", e.data);
          reject(new Error("Failed to create worker"));
          loadingFailure = e.data[1];
        }
        URL.revokeObjectURL(url);
      };
      console.debug("worker.postMessage", ["setup", version, esbuildWASM], [esbuildWASM]);
      worker.postMessage(["setup", version, esbuildWASM], [esbuildWASM]);
    });
  } catch (err) {
    emitter.status = loadingFailure || err + "";
    console.error("reloadWorker", err);
    throw err;
  }
}
var script = null;
function setupLocal(js, wasm) {
  const url = URL.createObjectURL(new Blob([js], { type: "application/javascript" }));
  if (script) script.remove();
  script = document.createElement("script");
  script.onload = async () => {
    const esbuild = window.esbuild;
    const options = { wasmURL: URL.createObjectURL(new Blob([wasm], { type: "application/wasm" })) };
    if (esbuild.startService) {
      await esbuild.startService(options);
    } else {
      await esbuild.initialize(options);
    }
    console.log("loaded esbuild @", esbuild.version, esbuild);
  };
  script.src = url;
  document.head.appendChild(script);
}
function sendIPC(message, progress) {
  return workerPromise.then(
    (worker) => {
      const id = Math.random().toString(36).substring(2, 15);
      const promise = new Promise((promiseResolve, promiseReject) => {
        waitingPromise[id] = {
          progress,
          resolve: (data) => {
            promiseResolve(data);
          },
          reject: (error) => {
            promiseReject(error);
          }
        };
      });
      worker.postMessage([id, message]);
      return promise;
    }
  );
}

// src/file-system-manager.ts
function absPath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}
var FileSystemManager = class _FileSystemManager {
  constructor(remote) {
    this.remote = remote;
    this.projectFiles = {
      // [`${this.tmpDirPath}/.gitkeep`]: { contents: '' },
    };
    this.currentWorkingDirectory = "/app";
    this.cwd = () => {
      return this.currentWorkingDirectory;
    };
    this.chdir = (path) => {
      var _a;
      const targetPath = absPath(path);
      this.currentWorkingDirectory = targetPath;
      (_a = this.remote) == null ? void 0 : _a.chdir(targetPath);
    };
    this.exists = (path) => {
      const targetPath = absPath(path);
      return targetPath in this.projectFiles;
    };
    this.isDirectory = (path) => {
      const targetPath = absPath(path);
      return this.fileNames.some((file) => file.startsWith(targetPath) && file.length > targetPath.length + 1);
    };
    this.setFiles = (files) => {
      var _a;
      for (const [path, file] of Object.entries(files)) {
        this.projectFiles[absPath(path)] = {
          ...this.projectFiles[absPath(path)] || {},
          ...file
        };
      }
      (_a = this.remote) == null ? void 0 : _a.setFiles(files);
    };
    this.writeFile = (path, contents) => {
      var _a;
      const targetPath = absPath(path);
      this.projectFiles[targetPath] = {
        ...this.projectFiles[targetPath] || {},
        contents
      };
      (_a = this.remote) == null ? void 0 : _a.writeFile(targetPath, contents);
    };
    this.appendFile = (path, contents) => {
      var _a, _b;
      const targetPath = absPath(path);
      this.writeFile(targetPath, (((_a = this.projectFiles[targetPath]) == null ? void 0 : _a.contents) || "") + contents);
      (_b = this.remote) == null ? void 0 : _b.appendFile(targetPath, contents);
    };
    this.deleteFile = (path) => {
      delete this.projectFiles[absPath(path)];
    };
    this.readFile = (path) => {
      var _a;
      return ((_a = this.projectFiles[absPath(path)]) == null ? void 0 : _a.contents) || "";
    };
    this.readdir = (path) => {
      const targetPath = absPath(path);
      return this.fileNames.filter((file) => file.startsWith(targetPath));
    };
  }
  get tmpDirPath() {
    return "/tmp";
  }
  get files() {
    return this.projectFiles;
  }
  get rawFiles() {
    return Object.fromEntries(Object.entries(this.projectFiles).map(([key, value2]) => [key, value2.contents]));
  }
  get fileNames() {
    return Object.keys(this.projectFiles);
  }
  toSerializable() {
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
      fs__setFiles: self.setFiles
    };
  }
  static fromFiles(files, remoteFS) {
    const fs = new _FileSystemManager(remoteFS);
    fs.setFiles(files);
    return fs;
  }
  static fromSerializedRemote(remote) {
    const fs = new _FileSystemManager(unserializeFS(remote));
    return fs;
  }
};
function unserializeFS(fs) {
  return new Proxy({}, {
    get(target, prop) {
      return fs[`fs__${prop}`];
    }
  });
}

// src/index.ts
async function initWorker(options) {
  const fs = new FileSystemManager();
  emitter.reload = { ...options };
  return {
    fs,
    npm__install: async (props) => {
      const response = await sendIPC({
        registryBaseUrl_: props.registryBaseUrl,
        command_: "npm_install",
        input_: props.rawFiles || fs.rawFiles,
        cwd_: props.cwd
      });
      return response;
    },
    esbuild__bundle: async (options2, props) => {
      const response = await sendIPC({
        command_: "build",
        input_: (props == null ? void 0 : props.rawFiles) || fs.rawFiles,
        options_: {
          target: "chrome67",
          format: "esm",
          splitting: true,
          bundle: true,
          sourcemap: true,
          minify: false,
          ...options2,
          loader: {
            ".html": "copy",
            ".svg": "file",
            ".png": "file",
            ".jpg": "file",
            ".jpeg": "file",
            ".gif": "file",
            ".ico": "file",
            ".webp": "file",
            ...options2.loader || {}
          }
        }
      });
      return response;
    }
  };
}
