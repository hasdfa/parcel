/**
 * @typedef {import('@parcel/types').BuildSuccessEvent} BuildSuccessEvent
 * @typedef {import('@parcel/types').Dependency} Dependency
 * @typedef {import('@parcel/types').PluginOptions} PluginOptions
 * @typedef {import('@parcel/types').BundleGraph} BundleGraph
 * @typedef {import('@parcel/types').PackagedBundle} PackagedBundle
 * @typedef {import('@parcel/types').Asset} Asset
 * @typedef {import('@parcel/diagnostic').Diagnostic} Diagnostic
 * @typedef {import('@parcel/utils').AnsiDiagnosticResult} AnsiDiagnosticResult
 */

import invariant from 'assert';
import {ansiHtml, prettyDiagnostic, PromiseQueue} from '@parcel/utils';

const HMR_ENDPOINT = '/__parcel_hmr/';

/**
 * @typedef {Object} HMRAsset
 * @property {string} id
 * @property {string} url
 * @property {string} type
 * @property {string} output
 * @property {string} envHash
 * @property {Object.<string, Object.<string, string>>} depsByBundle
 */

/**
 * @typedef {Object} HMRUpdateMessage
 * @property {'update'} type
 * @property {Array<HMRAsset>} assets
 */

/**
 * @typedef {Object} HMRErrorMessage
 * @property {'error'} type
 * @property {Object} diagnostics
 * @property {Array<AnsiDiagnosticResult>} diagnostics.ansi
 * @property {Array<Omit<AnsiDiagnosticResult, 'codeframe'>>} diagnostics.html
 */

/**
 * @typedef {HMRUpdateMessage | HMRErrorMessage} HMRMessage
 */

const FS_CONCURRENCY = 64;

export default class HMRServer {
  /** @type {HMRMessage | null} */
  unresolvedError = null;

  /** @type {function(HMRMessage): void} */
  broadcast;

  /**
   * @param {function(HMRMessage): void} broadcast
   */
  constructor(broadcast) {
    this.broadcast = broadcast;
  }

  /**
   * @param {PluginOptions} options
   * @param {Array<Diagnostic>} diagnostics
   */
  async emitError(options, diagnostics) {
    let renderedDiagnostics = await Promise.all(
      diagnostics.map(d => prettyDiagnostic(d, options)),
    );

    // store the most recent error so we can notify new connections
    // and so we can broadcast when the error is resolved
    this.unresolvedError = {
      type: 'error',
      diagnostics: {
        ansi: renderedDiagnostics,
        html: renderedDiagnostics.map((d, i) => {
          return {
            message: ansiHtml(d.message),
            stack: ansiHtml(d.stack),
            frames: d.frames.map(f => ({
              location: f.location,
              code: ansiHtml(f.code),
            })),
            hints: d.hints.map(hint => ansiHtml(hint)),
            documentation: diagnostics[i].documentationURL ?? '',
          };
        }),
      },
    };

    this.broadcast(this.unresolvedError);
  }

  /**
   * @param {BuildSuccessEvent} event
   */
  async emitUpdate(event) {
    this.unresolvedError = null;

    let changedAssets = new Set(event.changedAssets.values());
    if (changedAssets.size === 0) return;

    let queue = new PromiseQueue({maxConcurrent: FS_CONCURRENCY});
    for (let asset of changedAssets) {
      if (asset.type !== 'js' && asset.type !== 'css') {
        // If all of the incoming dependencies of the asset actually resolve to a JS asset
        // rather than the original, we can mark the runtimes as changed instead. URL runtimes
        // have a cache busting query param added with HMR enabled which will trigger a reload.
        let runtimes = new Set();
        let incomingDeps = event.bundleGraph.getIncomingDependencies(asset);
        let isOnlyReferencedByRuntimes = incomingDeps.every(dep => {
          let resolved = event.bundleGraph.getResolvedAsset(dep);
          let isRuntime = resolved?.type === 'js' && resolved !== asset;
          if (resolved && isRuntime) {
            runtimes.add(resolved);
          }
          return isRuntime;
        });

        if (isOnlyReferencedByRuntimes) {
          for (let runtime of runtimes) {
            changedAssets.add(runtime);
          }

          continue;
        }
      }

      queue.add(async () => {
        let dependencies = event.bundleGraph.getDependencies(asset);
        let depsByBundle = {};
        for (let bundle of event.bundleGraph.getBundlesWithAsset(asset)) {
          let deps = {};
          for (let dep of dependencies) {
            let resolved = event.bundleGraph.getResolvedAsset(dep, bundle);
            if (resolved) {
              deps[getSpecifier(dep)] =
                event.bundleGraph.getAssetPublicId(resolved);
            }
          }
          depsByBundle[bundle.id] = deps;
        }

        return {
          id: event.bundleGraph.getAssetPublicId(asset),
          url: getSourceURL(event.bundleGraph, asset),
          type: asset.type,
          // No need to send the contents of non-JS assets to the client.
          output:
            asset.type === 'js'
              ? await getHotAssetContents(event.bundleGraph, asset)
              : '',
          envHash: asset.env.id,
          depsByBundle,
        };
      });
    }

    let assets = await queue.run();
    this.broadcast({
      type: 'update',
      assets: assets,
    });
  }
}

/**
 * @param {Dependency} dep
 * @returns {string}
 */
function getSpecifier(dep) {
  if (typeof dep.meta.placeholder === 'string') {
    return dep.meta.placeholder;
  }

  return dep.specifier;
}

/**
 * @param {BundleGraph<PackagedBundle>} bundleGraph
 * @param {Asset} asset
 * @returns {Promise<string>}
 */
export async function getHotAssetContents(bundleGraph, asset) {
  let output = await asset.getCode();
  if (asset.type === 'js') {
    let publicId = bundleGraph.getAssetPublicId(asset);
    output = `parcelHotUpdate['${publicId}'] = function (require, module, exports) {${output}}`;
  }

  let sourcemap = await asset.getMap();
  if (sourcemap) {
    let sourcemapStringified = await sourcemap.stringify({
      format: 'inline',
      sourceRoot: '/__parcel_source_root/',
      // $FlowFixMe
      fs: asset.fs,
    });

    invariant(typeof sourcemapStringified === 'string');
    output += `\n//# sourceMappingURL=${sourcemapStringified}`;
    output += `\n//# sourceURL=${getSourceURL(bundleGraph, asset)}\n`;
  }

  return output;
}

/**
 * @param {BundleGraph} bundleGraph
 * @param {Asset} asset
 * @returns {string}
 */
function getSourceURL(bundleGraph, asset) {
  return HMR_ENDPOINT + asset.id;
}
