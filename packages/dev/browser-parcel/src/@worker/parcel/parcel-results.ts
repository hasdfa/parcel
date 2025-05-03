import type { BuildSuccessEvent } from "@parcel/types";
import { BundleOutputSuccess, FileSystem } from "../../types";
import PathUtils from "../path-utils";

function removeTrailingNewline(text: string): string {
  if (text[text.length - 1] === '\n') {
    return text.slice(0, -1);
  } else {
    return text;
  }
}

export async function collectParcelBuildResults(
  event: BuildSuccessEvent,
  fs: FileSystem,
): Promise<BundleOutputSuccess> {
  let bundleContents: {
    name: string;
    content: string;
    size: number;
    time: number;
  }[] = [];

  let sourcemaps = new Map<string, string>();
  for (let b of event.bundleGraph.getBundles()) {
    let { filePath, stats: { size, time } } = b;

    let name = PathUtils.toAssetPath(filePath);
    let content = removeTrailingNewline(await fs.readFile(filePath, 'utf8'));
    bundleContents.push({
      name,
      content,
      size,
      time,
    });
    if (content.length < 5000000 && (await fs.exists(filePath + '.map'))) {
      sourcemaps.set(name, await fs.readFile(filePath + '.map', 'utf8'));
    }
  }

  bundleContents.sort(({name: a}, {name: b}) => a.localeCompare(b));

  return {
    type: 'success',
    bundles: bundleContents,
    buildTime: event.buildTime,
    sourcemaps,
  };
}
