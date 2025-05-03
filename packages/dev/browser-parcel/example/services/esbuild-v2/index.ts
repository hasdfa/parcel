import { sendIPC } from "./ipc"
import { emitter } from "./global"
import { FileSystemManager } from "../file-system-manager"
import type { BuildOptions } from "esbuild-wasm"

export async function initWorker() {
  const fs = new FileSystemManager()
  emitter.reload = '0.25.3'

  return {
    fs,
    npm__install: async () => {
      const response = await sendIPC({
        command_: 'npm_install',
        input_: fs.rawFiles,
      })

      return response;
    },
    esbuild__bundle: async (projectId: string,options: BuildOptions) => {
      const response = await sendIPC({
        command_: 'build',
        input_: fs.rawFiles,
        options_: {
          bundle: true,
          sourcemap: true,
          minify: false,
          outdir: '/dist',
          ...options,
        }
      })

      return {
        projectId,
        ...response,
      }
    },
  }
}

export type EsbuildWorker = Awaited<ReturnType<typeof initWorker>>
