import {Transformer} from '@parcel/plugin';
import {getPlaiceholder} from 'plaiceholder';
import {getSize} from 'image-size';
import fs from 'fs/promises';

export default new Transformer({
  async transform({asset}) {
    // Only transform image assets
    if (!asset.type.startsWith('image/')) {
      return [asset];
    }

    const buffer = await fs.readFile(asset.filePath);
    const dimensions = getSize(buffer);

    // Generate blur placeholder
    const {base64} = await getPlaiceholder(buffer);

    // Create the transformed output
    const output = {
      src: asset.filePath,
      height: dimensions.height,
      width: dimensions.width,
      blurDataURL: base64,
      blurWidth: Math.floor(dimensions.width / 10),
      blurHeight: Math.floor(dimensions.height / 10),
    };

    // Update asset content
    asset.type = 'js';
    asset.setCode(`module.exports = ${JSON.stringify(output)};`);

    return [asset];
  },
});
