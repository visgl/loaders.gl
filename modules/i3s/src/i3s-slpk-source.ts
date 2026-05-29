// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {I3SSource, IndexedArchiveTilesetSource} from '@loaders.gl/tiles';
import type {CoreAPI, Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseSLPKArchive} from './lib/parsers/parse-slpk/parse-slpk';

/** Constructor input for {@link SLPKSource}. */
export type SLPKSourceInput = {
  /** SLPK archive URL or Blob. */
  url: string | Blob;
  /** Parser used for I3S JSON and tile content stored inside the archive. */
  loader: Loader;
  /** Base path exposed to the underlying I3S source. */
  basePath?: string;
  /** Core API used to parse inner I3S resources. */
  coreApi?: CoreAPI;
};

/**
 * I3S source backed by an SLPK archive.
 *
 * This source implements the same {@link I3SSource} runtime contract, so `Tileset3D` can traverse
 * archive-backed and URL-backed I3S datasets interchangeably.
 */
export class SLPKSource extends I3SSource {
  /**
   * Creates an I3S source that reads resources from an SLPK archive.
   * @param input Archive source input
   * @param loadOptions Loader options forwarded to inner resource parsing
   */
  constructor(input: SLPKSourceInput, loadOptions: LoaderOptions = {}) {
    let source: SLPKSource | undefined;
    const getCoreApi = () => source?.coreApi || input.coreApi;
    const archiveSource = new IndexedArchiveTilesetSource({
      data: input.url,
      fallbackFilename: 'tileset.slpk',
      archiveExtension: 'slpk',
      rootPath: '',
      rootMode: 'http',
      parseArchive: parseSLPKArchive,
      getFile: (archive, pathInArchive, mode = 'http') =>
        archive.getFile(pathInArchive, mode as any),
      getCoreApi,
      missingCoreApiMessage: 'SLPKSource requires an injected coreApi'
    });

    super(
      {
        url: archiveSource.sourceUrl,
        loader: input.loader as LoaderWithParser,
        basePath: input.basePath || archiveSource.sourceUrl,
        resolver: archiveSource,
        coreApi: input.coreApi
      },
      loadOptions
    );
    source = this;
  }
}
