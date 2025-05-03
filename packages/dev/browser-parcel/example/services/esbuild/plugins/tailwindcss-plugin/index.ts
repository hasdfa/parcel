import type { Plugin as ESBuildPlugin } from 'esbuild';
import * as tailwind from 'tailwindcss';

function tailwindPlugin(): ESBuildPlugin {
  return {
    name: 'tailwind-postcss',
    setup(build) {
      build.onEnd(async result => {
        await Promise.all(
          (result.outputFiles ?? [])
            .filter(f => f.path.endsWith('.css'))
            .map(async f => {
              // @ts-ignore
              f.text = await tailwind.compile(f.text);
            })
        );
      });
    },
  };
}

export default tailwindPlugin;
