import type { Plugin } from 'esbuild';

// esm-sh-external-resolve.js
export default function esmShExternalResolver(opts: {
  host?: string;
  resolutions?: Record<string, string>;
}): Plugin {
  // grabs "@scope/name" or "name" from any specifier
  // const rootPkg = (id) => {
  //   const parts = id.startsWith("@") ? id.split("/").slice(0, 2)   // "@scope/name/..."
  //                                    : [id.split("/")[0]];         // "name/..."
  //   return parts.join("/");
  // };

  return {
    name: "esm-sh-external-resolve",
    setup(build) {
      // bare specifiers only
      build.onResolve({ filter: /^[^./]|^\.[^./]|^\.$/ }, (args) => {
        // const root    = rootPkg(args.path);
        // const pinned  = resolutions[root] ? `@${resolutions[root]}` : "";
        // const query   = depsStr ? (pinned ? `&${depsStr.slice(1)}` : depsStr) : "";
        // const url     = `${host}/${args.path}${pinned}${query}`;
        return { path: args.path, external: true };
      });
    },
  };
}
