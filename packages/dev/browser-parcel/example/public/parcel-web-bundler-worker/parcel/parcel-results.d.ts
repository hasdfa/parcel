import type { BuildSuccessEvent } from "@parcel/types";
import { BundleOutputSuccess, FileSystem } from "../../types";
export declare function collectParcelBuildResults(event: BuildSuccessEvent, fs: FileSystem): Promise<BundleOutputSuccess>;
