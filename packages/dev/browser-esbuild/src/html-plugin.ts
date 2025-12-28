import * as esbuild from 'esbuild-wasm';

type FilesMap = Record<string, string>;

const isExternal = (u: string) =>
  /^(https?:)?\/\//i.test(u) || /^data:/i.test(u);
const stripPrefix = (p: string) => p.replace(/^\.\//, '').replace(/^\//, '');
const posixDirname = (p: string) =>
  p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
const posixJoin = (...parts: string[]) =>
  parts
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/\.\//g, '/')
    .replace(/^\.\//, '');

function posixRelative(fromDir: string, toPath: string) {
  const from = stripPrefix(fromDir).split('/').filter(Boolean);
  const to = stripPrefix(toPath).split('/').filter(Boolean);
  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i++;
  const up = from.length - i;
  const rest = to.slice(i);
  const rel = [...Array(up).fill('..'), ...rest].join('/');
  return rel.startsWith('.') ? rel : `./${rel || ''}`.replace(/\/$/, '');
}

function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re =
    /([A-Za-z_:][A-Za-z0-9_:\-\.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) {
    const k = m[1].toLowerCase();
    const v = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[k] = v;
  }
  return attrs;
}

function rewriteHtml(html: string, scriptSrc: string, cssHref?: string) {
  // remove local module scripts + local stylesheet links
  html = html
    .replace(
      /<script\b[^>]*type=["']module["'][^>]*src=["'](?!https?:|\/\/|data:)[^"']+["'][^>]*>\s*<\/script>\s*/gi,
      '',
    )
    .replace(
      /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'](?!https?:|\/\/|data:)[^"']+["'][^>]*>\s*/gi,
      '',
    );

  const cssTag = cssHref
    ? `  <link rel="stylesheet" href="${cssHref}" />\n`
    : '';
  const jsTag = `  <script type="module" src="${scriptSrc}"></script>\n`;

  if (/<\/head>/i.test(html))
    html = html.replace(/<\/head>/i, `${cssTag}</head>`);
  else if (cssTag) html = cssTag + html;

  if (/<\/body>/i.test(html))
    html = html.replace(/<\/body>/i, `${jsTag}</body>`);
  else html = html + '\n' + jsTag;

  return html;
}

export function htmlBundlerPlugin(files: FilesMap): esbuild.Plugin {
  const htmlEntries = new Set<string>();

  return {
    name: 'html-bundler-and-emitter',
    setup(build) {
      build.onResolve({filter: /\.html$/}, args => {
        // Treat *.html entry points as JS proxy modules
        if (args.kind === 'entry-point') {
          const norm = stripPrefix(args.path);
          htmlEntries.add(norm);
          return {path: norm, namespace: 'html-entry'};
        }
        return {path: stripPrefix(args.path), namespace: 'file'};
      });

      build.onLoad({filter: /.*/, namespace: 'html-entry'}, args => {
        const key = args.path;
        const html = files[key] ?? files[`./${key}`];
        if (!html) throw new Error(`Missing HTML: ${key}`);

        const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
        const scriptTags = html.match(/<script\b[^>]*>/gi) ?? [];

        const styles = linkTags
          .map(parseAttrs)
          .filter(a =>
            (a.rel ?? '').toLowerCase().split(/\s+/).includes('stylesheet'),
          )
          .map(a => a.href)
          .filter(Boolean)
          .filter(h => !isExternal(h))
          .map(h => (h.startsWith('/') ? `.${h}` : h));

        const scripts = scriptTags
          .map(parseAttrs)
          .filter(a => (a.type ?? '').toLowerCase() === 'module')
          .map(a => a.src)
          .filter(Boolean)
          .filter(s => !isExternal(s))
          .map(s => (s.startsWith('/') ? `.${s}` : s));

        // Add default entry points if none found
        if (scripts.length === 0) {
          const jsNames = ['src/index', 'src/main', 'index', 'main'];
          const jsExts = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.mts'];
          const resolveDir = posixDirname(args.path) || '.';
          outer: for (const name of jsNames) {
            for (const ext of jsExts) {
              const candidate = posixJoin(resolveDir, `${name}${ext}`);
              if (files[candidate] || files[`./${candidate}`]) {
                scripts.push(`./${name}${ext}`);
                break outer;
              }
            }
          }
        }
        if (styles.length === 0) {
          const cssNames = ['src/index', 'src/main', 'index', 'main'];
          const cssExts = ['.css', '.scss', '.sass', '.less'];
          const resolveDir = posixDirname(args.path) || '.';
          outer: for (const name of cssNames) {
            for (const ext of cssExts) {
              const candidate = posixJoin(resolveDir, `${name}${ext}`);
              if (files[candidate] || files[`./${candidate}`]) {
                styles.push(`./${name}${ext}`);
                break outer;
              }
            }
          }
        }

        const contents = [...styles, ...scripts]
          .map(p => `import ${JSON.stringify(p)};`)
          .join('\n');

        return {
          loader: 'js',
          contents,
          resolveDir: posixDirname(args.path) || '.',
        };
      });

      // 2) FIX onEnd output dir + emit HTML even when using `outfile`
      build.onEnd(result => {
        if (!result.outputFiles) {
          return;
        }

        const meta = result.metafile;
        if (!meta) {
          throw new Error('Set metafile:true to emit rewritten HTML');
        }

        const outBaseDir =
          build.initialOptions.outdir ??
          (build.initialOptions.outfile
            ? posixDirname(build.initialOptions.outfile)
            : '.');

        const enc = new TextEncoder();

        for (const htmlPath of htmlEntries) {
          const srcHtml = files[htmlPath] ?? files[`./${htmlPath}`];
          if (!srcHtml) {
            console.debug('[build.onEnd] missing source HTML for', {
              srcHtml,
              htmlPath,
              files,
            });
            continue;
          }

          const jsOut = Object.keys(meta.outputs).find(
            o =>
              meta.outputs[o].entryPoint === `html-entry:${htmlPath}` &&
              o.endsWith('.js'),
          );
          if (!jsOut) {
            console.debug('[build.onEnd] missing JS output for', {
              jsOut,
              outputs: meta.outputs,
            });
            continue;
          }

          const cssOut = (meta.outputs as any)[jsOut]?.cssBundle as
            | string
            | undefined;

          const htmlOutPath = posixJoin(outBaseDir, htmlPath);
          const htmlOutDir = posixDirname(htmlOutPath);

          const scriptSrc = posixRelative(htmlOutDir, jsOut);
          const cssHref = cssOut
            ? posixRelative(htmlOutDir, cssOut)
            : undefined;
          const newHtml = rewriteHtml(srcHtml, scriptSrc, cssHref);

          result.outputFiles.push({
            path: htmlOutPath,
            contents: enc.encode(newHtml),
            text: newHtml,
          } as any);
        }
      });
    },
  };
}
