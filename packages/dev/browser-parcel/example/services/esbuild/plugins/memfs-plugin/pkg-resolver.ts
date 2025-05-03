import { join, resolve as resolvePath } from "path";
import { BaseFileSystemManager } from "@/services/file-system-manager";
import * as jsResolver from "./js-resolver";

/**
 * Resolve the real entry file for an import spec such as:
 *   "@mui/material/Avatar"  -> deep component file
 *   "lodash"                -> package root
 *
 * @param fs   An fs/promises-compatible object.
 * @param cwd  Directory that contains the `node_modules` folder.
 * @param spec The raw module specifier as written in code.
 */
export function resolvePackageEntry(
  fs: BaseFileSystemManager,
  cwd: string,
  spec: string
): string | null {
  /* ------------------------------------------------------------
   * 1. Split the spec into <packageName> and <exportSubPath>
   *    – Handles scoped packages like "@scope/pkg".
   * ---------------------------------------------------------- */
  const parts = spec.split("/");

  const isScoped = spec.startsWith("@");
  const packageName = isScoped ? parts.slice(0, 2).join("/") : parts[0];
  const exportSubPath = parts.slice(isScoped ? 2 : 1).join("/"); // "" when none

  const packageRoot = join(cwd, "node_modules", packageName);
  const pkgJsonPath = join(packageRoot, "package.json");

  /* ------------------------------------------------------------
   * 2. Read and parse package.json (bail if missing).
   * ---------------------------------------------------------- */
  let pkg: any;
  try {
    pkg = JSON.parse(fs.readFile(pkgJsonPath));
  } catch {
    console.log('[unresolved] Could not read package.json', pkgJsonPath);
    return null;
  }

  /* ------------------------------------------------------------
   * 3. Build the ordered candidate list.
   * ---------------------------------------------------------- */
  const candidates: string[] = [];
  const push = (p?: string) => p && candidates.push(p);

  /* ---- 3a. exports (incl. conditional + sub-path) ------------- */
  const exp = pkg.exports;
  if (exp) {
    const token = exportSubPath ? `./${exportSubPath}` : ".";
    const entry = typeof exp === "object" ? exp[token] ?? exp["."] : exportSubPath ? null : exp;

    const addFromMapping = (m: any) => {
      if (typeof m === "string") push(m);
      else if (typeof m === "object") {
        for (const cond of ["import", "module", "browser", "require", "default"])
          if (typeof m[cond] === "string") {
            push(m[cond]);
            break;
          }
      }
    };
    addFromMapping(entry);
  }

  /* ---- 3b. legacy fields (module / browser / main) ------------- */
  const addLegacy = (field: string) => {
    const val = pkg[field];
    if (typeof val === "string") {
      push(exportSubPath ? join(val, "..", exportSubPath) : val);
    }
  };
  addLegacy("module");
  addLegacy("browser");
  addLegacy("main");

  /* ---- 3c. direct sub-path fall-back (e.g. Avatar.js) ---------- */
  if (exportSubPath) push(exportSubPath);

  /* ---- 3d. index.* fall-backs ---------------------------------- */
  if (!exportSubPath)
    candidates.push(...jsResolver.resolveExtensions.map(ext => `index${ext}`));

  /* ------------------------------------------------------------
   * 4. Iterate candidates until one exists & is a file.
   * ---------------------------------------------------------- */

  for (const rel of candidates) {
    const abs = resolvePath(packageRoot, rel);

    // i. as-is
    if (fs.exists(abs)) return abs;

    // ii. try common extensions
    for (const ext of ["", ".js", ".mjs", ".cjs", ".ts", ".tsx"]) {
      const alt = abs.endsWith(ext) ? abs : abs + ext;
      if (fs.exists(alt)) return alt;
    }

    // iii. directory → index.*
    try {
      if (fs.isDirectory(abs)) {
        for (const idx of ["index.js", "index.mjs", "index.cjs", "index.ts", "index.tsx"]) {
          const idp = join(abs, idx);
          if (fs.exists(idp)) return idp;
        }
      }
    } catch { /* ignore */ }
  }

  console.log('[unresolved] Could not resolve package entry', JSON.stringify({
    cwd,
    spec,
    candidates,
    fs: fs.readdir(packageRoot),
  }, null, 2));
  return null;
}
