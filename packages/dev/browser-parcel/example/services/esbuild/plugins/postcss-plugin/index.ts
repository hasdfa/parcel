import type { Plugin } from 'esbuild-wasm';
import type { FileSystemManager } from '../../../file-system-manager';
import postcss, { Plugin as PostCSSPlugin } from 'postcss';
import path from 'path';

interface EsbuildPostcssPluginOptions {
  plugins: PostCSSPlugin[];
  fs: FileSystemManager;
}

const esbuildPostcssPlugin = (options: EsbuildPostcssPluginOptions): Plugin => ({
  name: "postcss",
  setup: function (build) {
    const { fs } = options;
    const rootDir = fs.cwd();
    const tmpDirPath = fs.tmpDirPath;

    build.onResolve(
      { filter: /.\.(css)$/, namespace: "file" },
      async (args) => {
        // use esbuild path resolution for node_modules, typescript paths, etc.
        // https://esbuild.github.io/plugins/#resolve
        const resolution = await build.resolve(args.path, {
          resolveDir: args.resolveDir,
          kind: args.kind,
        });
        if (resolution.errors.length > 0) {
          return { errors: resolution.errors }
        }

        const sourceFullPath = resolution.path;
        const sourceExt = path.extname(sourceFullPath);
        const sourceBaseName = path.basename(sourceFullPath, sourceExt);
        const sourceDir = path.dirname(sourceFullPath);
        const sourceRelDir = path.relative(path.dirname(rootDir), sourceDir);

        const tmpDir = path.resolve(tmpDirPath, sourceRelDir);
        const tmpFilePath = path.resolve(tmpDir, `${sourceBaseName}.css`);

        const css = await fs.readFile(sourceFullPath);
        const result = await postcss(options.plugins).process(css, {
          from: sourceFullPath,
          to: tmpFilePath,
        });

        // Write the result file
        await fs.writeFile(tmpFilePath, result.css);

        // https://esbuild.github.io/plugins/#on-resolve-results
        return {
          path: tmpFilePath,
          // watch for changes to the original input for automatic rebuilds
          watchFiles: [ sourceFullPath ],
        };
      }
    );
  },
});

export type { PostCSSPlugin };

export default esbuildPostcssPlugin;
