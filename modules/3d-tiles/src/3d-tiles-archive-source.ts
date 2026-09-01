// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {IndexedArchiveTilesetSource, Tiles3DSource} from '@loaders.gl/tiles';
import type {CoreAPI, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {parse3DTilesArchive} from './3d-tiles-archive/3d-tiles-archive-parser';

/** Constructor input for {@link Tiles3DArchiveSource}. */
export type Tiles3DArchiveSourceInput = {
  /** 3TZ archive URL or Blob. */
  url: string | Blob;
  /** Parser used for 3D Tiles JSON and tile content stored inside the archive. */
  loader: Loader;
  /** Base path exposed to the underlying 3D Tiles source. */
  basePath?: string;
  /** Core API used to parse inner 3D Tiles resources. */
  coreApi?: CoreAPI;
};

/**
 * 3D Tiles source backed by a 3TZ archive.
 *
 * This source implements the same {@link Tiles3DSource} runtime contract, so `Tileset3D` can
 * traverse archive-backed and URL-backed 3D Tiles datasets interchangeably.
 */
export class Tiles3DArchiveSource extends Tiles3DSource {
  /**
   * Creates a 3D Tiles source that reads resources from a 3TZ archive.
   * @param input Archive source input
   * @param loadOptions Loader options forwarded to inner resource parsing
   */
  constructor(input: Tiles3DArchiveSourceInput, loadOptions: LoaderOptions = {}) {
    let source: Tiles3DArchiveSource | undefined;
    const getCoreApi = () => source?.coreApi || input.coreApi;
    const archiveSource = new IndexedArchiveTilesetSource({
      data: input.url,
      fallbackFilename: 'tileset.3tz',
      archiveExtension: '3tz',
      rootPath: 'tileset.json',
      parseArchive: parse3DTilesArchive,
      getFile: (archive, pathInArchive) => archive.getFile(pathInArchive),
      getCoreApi,
      missingCoreApiMessage: 'Tiles3DArchiveSource requires an injected coreApi'
    });

    super(
      {
        url: archiveSource.sourceUrl,
        loader: input.loader,
        basePath: input.basePath || archiveSource.sourceUrl,
        resolver: archiveSource,
        coreApi: input.coreApi
      },
      loadOptions
    );
    source = this;
  }
}
