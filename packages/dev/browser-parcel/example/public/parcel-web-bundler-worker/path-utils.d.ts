declare const PathUtils: {
    APP_DIR: string;
    DIST_DIR: string;
    CACHE_DIR: string;
    fromAssetPath(str: string): string;
    toAssetPath(str: string): string;
};
export default PathUtils;
