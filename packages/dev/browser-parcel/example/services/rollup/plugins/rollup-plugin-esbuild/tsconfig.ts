import { FileSystemManager } from '@/services/file-system-manager';
import path from 'path';
import json5 from 'json5';

const cache = new Map<string, unknown>()

export function getTsconfig(
  fs: FileSystemManager,
  searchPath: string,
  configName: string,
): any | undefined {
  // Check cache first
  const cacheKey = `${searchPath}:${configName}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Find the config file by walking up the directory tree
  let currentDir = path.dirname(searchPath);
  const rootDir = path.parse(searchPath).root;

  while (currentDir !== rootDir) {
    const configPath = path.join(currentDir, configName);
    if (fs.exists(configPath)) {
      try {
        // Read and parse the config file
        const configContent = fs.readFile(configPath);
        const config = json5.parse(configContent);

        // Cache the result
        cache.set(cacheKey, config);
        return config;
      } catch (err) {
        // If there's an error reading or parsing the file, continue searching
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return undefined;
}
