import JSZip from 'jszip';
import type {FSMap} from './assets';

export * from './assets';
export * from './options';

export const ctrlKey: string = navigator.platform.includes('Mac')
  ? '⌘'
  : 'Ctrl';

export function nthIndex(str: string, pat: string, n: number): number {
  let length = str.length;
  let i = -1;
  while (n-- && i++ < length) {
    i = str.indexOf(pat, i);
    if (i < 0) break;
  }
  return i;
}

function downloadBlob(name: string, blob: Blob) {
  const el = document.createElement('a');
  el.href = URL.createObjectURL(blob);
  el.download = name;
  el.click();
  setTimeout(() => URL.revokeObjectURL(el.href), 1000);
}

export async function downloadZIP(files: Map<string, {value: string}>) {
  let zip = new JSZip();

  for (let [name, {value}] of files) {
    zip.file(name, value);
  }

  let blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 5,
    },
  });

  downloadBlob('repl.zip', blob);
}

export async function extractZIP(content: ArrayBuffer): Promise<FSMap> {
  let zip = await JSZip.loadAsync(content);

  let files = (
    await Promise.all(
      Object.entries(zip.files).map(async ([relativePath, zipEntry]) => {
        if (!zipEntry.dir) {
          return [relativePath, {value: await zipEntry.async('string')}] as [
            string,
            {value: string},
          ];
        }
      }),
    )
  ).filter((x): x is [string, {value: string}] => x != null);

  let result: FSMap = new Map();
  function get(p: string[]): FSMap {
    let v: any = result;
    for (let e of p) {
      let c = v.get(e);
      if (!c) {
        c = new Map();
        v.set(e, c);
      }
      v = c;
    }
    return v;
  }
  for (let [p, data] of files) {
    let pSplit = p.split('/');
    let folder = pSplit.slice(0, -1);
    let file = pSplit[pSplit.length - 1];
    get(folder).set(file, data);
  }

  return result;
}

export function linkSourceMapVisualization(
  bundle: string,
  sourcemap: string,
): string {
  let hash = Buffer.concat([
    Buffer.from(String(bundle.length)),
    Buffer.from([0]),
    Buffer.from(bundle),
    Buffer.from(String(sourcemap.length)),
    Buffer.from([0]),
    Buffer.from(sourcemap),
  ]);

  return (
    'https://evanw.github.io/source-map-visualization/#' +
    hash.toString('base64')
  );
}
