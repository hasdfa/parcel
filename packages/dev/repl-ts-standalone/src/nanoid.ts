// This alphabet uses `A-Za-z0-9_-` symbols.
// The order of characters is optimized for better gzip and brotli compression.
const a = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

const nanoid = (e = 21) => {
  let t = '',
    r = crypto.getRandomValues(new Uint8Array(e));
  for (let n = 0; n < e; n++) t += a[63 & r[n]];
  return t;
};

export default nanoid;
