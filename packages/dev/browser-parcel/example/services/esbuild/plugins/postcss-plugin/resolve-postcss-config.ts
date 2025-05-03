// import type { FileSystemManager } from '../../file-system-manager';
// import tailwind  from 'tailwindcss';

// export async function resolvePostCssConfig(
//   fs: FileSystemManager,
//   startDir: string = fs.cwd(),
// ) {
//   const CANDIDATES = [
//     'postcss.config.js',
//     'postcss.config.cjs',
//     'postcss.config.json',
//     '.postcssrc',
//     '.postcssrc.js',
//     '.postcssrc.json',
//   ];

//   const parseJSON = (txt: string) => JSON.parse(txt);

//   const evalCJS = (code: string) => {
//     // minimal CommonJS evaluator; resolves `require("tailwindcss")`
//     const m = { exports: {} };
//     const fakeRequire = (id: string) => (id === 'tailwindcss' ? tailwind : {});
//     new Function('require', 'module', 'exports', code)(fakeRequire, m, m.exports);
//     return m.exports;
//   };

//   let dir = startDir.replace(/\/$/, '');
//   while (true) {
//     for (const file of CANDIDATES) {
//       const full = `${dir}/${file}`;
//       const src  = fs.readFile(full);
//       if (src) {
//         if (file.endsWith('.json') || file.endsWith('.rc')) {
//           return parseJSON(src);
//         }
//         // assume CommonJS
//         return evalCJS(src);
//       }
//     }
//     if (dir === '' || dir === '/') break;
//     dir = dir.split('/').slice(0, -1).join('/') || '/';
//   }
//   return null;
// }
