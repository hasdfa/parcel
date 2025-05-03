import { FileSystemManager } from "@/services/file-system-manager";

export const resolveExtensions = [
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.json',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  '.mjsx',
  '.mjsx',
]

export const resolveCandidates = [
  ...resolveExtensions,
  ...resolveExtensions.map(ext => `index${ext}`),
]

export function jsResolver(importPath: string, fs: FileSystemManager) {
  const attempts = [
    importPath,
    ...resolveExtensions.map(ext => `${importPath}${ext}`),
    ...resolveExtensions.map(ext => `${importPath}/index${ext}`),
  ]

  for (const attempt of attempts) {
    if (fs.exists(attempt)) {
      return attempt;
    }
  }

  return null;
}
