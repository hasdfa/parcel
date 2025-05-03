import path from "path";

const APP_DIR = '/app';
const DIST_DIR = '/app/dist';
const CACHE_DIR = '/.parcel-cache';

const PathUtils = {
  APP_DIR,
  DIST_DIR,
  CACHE_DIR,
  fromAssetPath(str: string): string {
    return path.join(APP_DIR, str);
  },
  toAssetPath(str: string): string {
    return str.startsWith(APP_DIR) ? str.slice(APP_DIR.length) : str;
  },
};

export default PathUtils;
