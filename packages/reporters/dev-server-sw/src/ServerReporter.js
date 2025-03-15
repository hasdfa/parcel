import {Reporter} from '@parcel/plugin';
import HMRServer, {getHotAssetContents} from './HMRServer';

let hmrServer;
/** @type {(() => void) | void} */
let hmrAssetSourceCleanup;

export default new Reporter({
  async report({event, options}) {
    let {hmrOptions} = options;
    switch (event.type) {
      case 'watchStart': {
        if (hmrOptions) {
          hmrServer = new HMRServer(data =>
            // @ts-ignore
            globalThis.PARCEL_SERVICE_WORKER('hmrUpdate', data),
          );
        }
        break;
      }
      case 'watchEnd':
        break;
      case 'buildStart':
        break;
      case 'buildSuccess':
        {
          /** @type {Object.<string, string>} */
          let files = {};
          for (let f of await options.outputFS.readdir('/app/dist')) {
            let fileContent = await options.outputFS.readFile(
              '/app/dist/' + f,
              'utf8',
            );

            if (/^[\d,]+$/.test(fileContent)) {
              fileContent = Buffer.from(
                fileContent.split(',').map(Number),
              ).toString('utf8');
            }

            files[f] = fileContent;
          }
          const {projectId, previewHost} = JSON.parse(
            await options.outputFS.readFile('/app/.preview-data', 'utf8'),
          );
          // @ts-ignore
          await globalThis.PARCEL_SERVICE_WORKER('setFS', {
            projectId,
            previewHost,
            files,
          });

          hmrAssetSourceCleanup?.();
          // @ts-ignore
          hmrAssetSourceCleanup = globalThis.PARCEL_SERVICE_WORKER_REGISTER(
            'hmrAssetSource',
            async id => {
              let bundleGraph = event.bundleGraph;
              let asset = bundleGraph.getAssetById(id);
              return [
                asset.type,
                await getHotAssetContents(bundleGraph, asset),
              ];
            },
          );

          if (hmrServer) {
            await hmrServer?.emitUpdate(event);
          }
        }
        break;
      // We show this in the "frontend" as opposed to the iframe
      // case 'buildFailure':
      //   await hmrServer?.emitError(options, event.diagnostics);
      //   break;
    }
  },
});
