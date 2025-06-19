import {BuildRequest, BuildResponse, IPCInitOptions, sendIPC} from './ipc';
import {emitter} from './global';
import {FileSystemManager} from './file-system-manager';
import type {BuildOptions, FormatMessagesOptions} from 'esbuild-wasm';

export async function initWorker(options: IPCInitOptions) {
  const fs = new FileSystemManager();
  emitter.reload = {...options};

  return {
    fs,
    npm__install: async (props: {
      cwd?: string;
      registryBaseUrl: string;
      rawFiles?: Record<string, string>;
      progress?: (type: string, message: string) => void;
    }) => {
      const response = await sendIPC(
        {
          registryBaseUrl_: props.registryBaseUrl,
          command_: 'npm_install',
          input_: props.rawFiles || fs.rawFiles,
          cwd_: props.cwd,
        },
        {
          ...(props.progress
            ? {
                progress: (data: any) => {
                  props.progress!(data.type, data.message);
                },
              }
            : {}),
        },
      );

      return response;
    },
    esbuild__bundle: async (
      options: BuildOptions,
      props?: {
        formatOptions?: Partial<FormatMessagesOptions>;
        rawFiles?: Record<string, string>;
        postprocess?: Omit<
          NonNullable<BuildRequest['postprocess']>,
          'filePatches'
        > & {
          filePatches?: Record<string, (contents: string) => string>;
        };
        upload?: NonNullable<BuildRequest['upload']>;
      },
    ) => {
      const response = await sendIPC(
        {
          command_: 'build',
          input_: props?.rawFiles || fs.rawFiles,
          formatOptions: props?.formatOptions,
          options_: {
            target: 'chrome67',
            format: 'esm',
            splitting: true,
            bundle: true,
            sourcemap: true,
            minify: false,
            ...options,
            loader: {
              '.html': 'copy',
              '.svg': 'file',
              '.png': 'file',
              '.jpg': 'file',
              '.jpeg': 'file',
              '.gif': 'file',
              '.ico': 'file',
              '.webp': 'file',
              ...(options.loader || {}),
            },
          },
          upload: props?.upload,
          ...((props?.postprocess
            ? {
                postprocess: {
                  filePolyfills: props.postprocess.filePolyfills,
                  ...(props.postprocess.filePatches
                    ? {filePatches: Object.keys(props.postprocess.filePatches)}
                    : {}),
                },
              }
            : {}) as any),
        },
        {
          'postprocess@file-patch': ([path, contents]: [string, string]) => {
            return props?.postprocess?.filePatches?.[path]
              ? props.postprocess.filePatches[path](contents)
              : contents;
          },
        },
      );

      return response as BuildResponse;
    },
  };
}

export type EsbuildWorker = Awaited<ReturnType<typeof initWorker>>;
