/* eslint-disable no-restricted-globals */
// @flow strict

import nanoid from './nanoid';

const PREVIEW_PATH = '/__repl-build__dist/';

let isSafari =
  /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
let lastHMRStream: ((data: any) => void) | undefined;

type ClientId = string;
type ParentId = string;

let sendToIFrame = new Map<ClientId, (data: string) => void>();
let pages = new Map<ParentId, Record<string, string>>();
let parentPorts = new Map<ParentId, MessagePort>();
let parentToIframe = new Map<ParentId, ClientId>();
let iframeToParent = new Map<ClientId, ParentId>();

(global as any).parentPorts = parentPorts;
(global as any).parentToIframe = parentToIframe;
(global as any).iframeToParent = iframeToParent;

const SECURITY_HEADERS = {
  // 'Cross-Origin-Embedder-Policy': 'require-corp',
  // 'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
  'Cross-Origin-Opener-Policy': 'unsafe-none',
};

const MIME = new Map([
  ['html', 'text/html'],
  ['js', 'text/javascript'],
  ['css', 'text/css'],
]);

// // TODO figure out which script is the entry
// function htmlWrapperForJS(script) {
//   return `<script type="application/javascript">
// window.console = {
//   log: function() {
//     var content = Array.from(arguments)
//       .map(v => (typeof v === "object" ? JSON.stringify(v) : v))
//       .join(" ");
//     document
//       .getElementById("output")
//       .appendChild(document.createTextNode(content + "\\n"));
//   },
//   warn: function() {
//     console.log.apply(console, arguments);
//   },
//   info: function() {
//     console.log.apply(console, arguments);
//   },
//   error: function() {
//     console.log.apply(console, arguments);
//   }
// };
// window.onerror = function(e) {
//   console.error(e.message);
//   console.error(e.stack);
// }
// </script>
// <body>
// Console output:<br>
// <div id="output" style="font-family: monospace;white-space: pre-wrap;"></div>
// </body>
// <script type="application/javascript">
// // try{
// ${script}
// // } catch(e){
// //   console.error(e.message);
// //   console.error(e.stack);
// // }
// </script>`;
// }

// listen here instead of attaching temporary 'message' event listeners to self
let messageProxy = new EventTarget();

self.addEventListener('message', (evt: any) => {
  let parentId = evt?.source?.id;
  let {type, data, id} = evt.data;
  console.log('[debug] sw::message', {type, data, id});

  if (type === 'setFS') {
    // called by worker
    evt.source?.postMessage({id});
    pages.set(parentId, data);
  } else if (type === 'getID') {
    evt.source?.postMessage({id, data: parentId});
  } else if (type === 'hmrUpdate') {
    // called by worker
    parentPorts.set(parentId, evt.source as MessagePort);
    let clientId = parentToIframe.get(parentId);
    let send =
      (clientId != null ? sendToIFrame.get(clientId) : null) ?? lastHMRStream;
    send?.(data);
    evt.source?.postMessage({id});
  } else if (type === 'setPreviewDomain') {
    if (data && typeof data === 'string') {
      PREVIEW_DOMAIN = data;
    }
  } else {
    let wrapper = new Event(evt.type);
    // @ts-expect-error
    wrapper.data = evt.data;
    messageProxy.dispatchEvent(wrapper);
  }
});

let encodeUTF8 = new TextEncoder();

self.addEventListener('fetch', (evt: any) => {
  console.log('[debug] sw::fetch', evt);

  let url = new URL(evt.request.url);
  let {clientId} = evt;
  let parentId;
  if (url.searchParams.has('parentId')) {
    clientId = evt.clientId ?? evt.resultingClientId ?? evt.targetClientId;
    parentId = url.searchParams.get('parentId')!;
    parentToIframe.set(parentId, clientId);
    iframeToParent.set(clientId, parentId);
  } else {
    parentId = iframeToParent.get(evt.clientId);
  }
  if (parentId == null && isSafari) {
    parentId = [...pages.keys()].slice(-1)[0];
  }

  console.log(
    '[debug] sw::fetch::parentId',
    JSON.stringify({
      parentId,
      PREVIEW_PATH,
      pathname: url.pathname,
      isPreviewPath: url.pathname.startsWith(PREVIEW_PATH),
    }),
  );

  if (
    evt.request.headers.get('Accept') === 'text/event-stream' &&
    url.pathname === '/__parcel_hmr'
  ) {
    let stream = new ReadableStream({
      start: controller => {
        let cb = (data: any) => {
          let chunk = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encodeUTF8.encode(chunk));
        };
        sendToIFrame.set(clientId, cb);
        lastHMRStream = cb;
      },
    });

    evt.respondWith(
      new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Transfer-Encoding': 'chunked',
          Connection: 'keep-alive',
          ...SECURITY_HEADERS,
        },
      }),
    );
  } else if (url.pathname.startsWith('/__parcel_hmr/')) {
    evt.respondWith(
      (async () => {
        let port = parentId != null ? parentPorts.get(parentId) : null;

        if (port == null) {
          return new Response(null, {status: 500});
        }

        let [type, content] = await sendMsg(
          port,
          'hmrAssetSource',
          url.pathname.slice('/__parcel_hmr/'.length),
        );
        return new Response(content, {
          headers: {
            'Content-Type':
              (MIME.get(type) ?? 'application/octet-stream') +
              '; charset=utf-8',
            'Cache-Control': 'no-store',
            ...SECURITY_HEADERS,
          },
        });
      })(),
    );
  } else if (url.pathname.startsWith(PREVIEW_PATH)) {
    if (!parentId || !pages.has(parentId)) {
      parentId = [...pages.keys()].slice(-1)[0];
    }

    let filename = url.pathname.slice(PREVIEW_PATH.length);
    let file = pages.get(parentId)?.[filename];
    if (file == null) {
      console.error('requested missing file', parentId, filename, pages);
    }

    evt.respondWith(
      new Response(file, {
        headers: {
          'Content-Type':
            (MIME.get(extname(filename)) ?? 'application/octet-stream') +
            '; charset=utf-8',
          'Cache-Control': 'no-store',
          ...SECURITY_HEADERS,
        },
      }),
    );
  }
});

function extname(filename: string) {
  return filename.slice(filename.lastIndexOf('.') + 1);
}

function removeNonExistingKeys(existing: Set<string>, map: Map<string, any>) {
  for (let id of map.keys()) {
    if (!existing.has(id)) {
      map.delete(id);
    }
  }
}
setInterval(async () => {
  // @ts-expect-error
  const clients: {id: any}[] = self.clients
    ? await self.clients.matchAll()
    : [];
  let existingClients = new Set(clients.map(c => c.id));

  removeNonExistingKeys(existingClients, pages);
  removeNonExistingKeys(existingClients, sendToIFrame);
  removeNonExistingKeys(existingClients, parentToIframe);
  removeNonExistingKeys(existingClients, iframeToParent);
}, 20000);

function sendMsg(
  target: MessagePort,
  type: string,
  data?: any,
  transfer?: any,
) {
  let id = nanoid();
  return new Promise<any>(resolve => {
    let handler = ((evt: MessageEvent) => {
      if (evt.data.id === id) {
        messageProxy.removeEventListener('message', handler);
        resolve(evt.data.data);
      }
    }) as unknown as EventListenerOrEventListenerObject;
    messageProxy.addEventListener('message', handler);
    target.postMessage({type, data, id}, transfer);
  });
}
