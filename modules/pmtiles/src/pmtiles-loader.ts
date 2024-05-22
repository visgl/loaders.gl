// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions, ReadableFile} from '@loaders.gl/loader-utils';
import {BlobFile} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/version';

import {VectorSourceInfo, ImageSourceInfo} from './source-info';
import {PMTilesTileSource, PMTilesTileSourceProps} from './pmtiles-source';

export type PMTilesLoaderOptions = LoaderOptions & {
  pmtiles?: PMTilesTileSourceProps['pmtiles'];
};

/**
 * Loader for PMTiles metadata
 * @note This loader is intended to allow PMTiles to be treated like other file types in top-level loading logic.
 * @note For actual access to the tile data, use the PMTilesSource class.
 */
export const PMTilesLoader = {
  name: 'PMTiles',
  id: 'pmtiles',
  module: 'pmtiles',
  version: VERSION,
  extensions: ['pmtiles'],
  mimeTypes: ['application/octet-stream'],
  tests: ['PMTiles'],
  options: {
    pmtiles: {}
  },
  parse: async (arrayBuffer: ArrayBuffer, options?: PMTilesLoaderOptions) =>
    parseFileAsPMTiles(new BlobFile(new Blob([arrayBuffer])), options),
  parseFile: parseFileAsPMTiles
} as const satisfies LoaderWithParser<
  VectorSourceInfo | ImageSourceInfo,
  never,
  PMTilesLoaderOptions
>;

async function parseFileAsPMTiles(
  file: ReadableFile,
  options?: PMTilesLoaderOptions
): Promise<VectorSourceInfo | ImageSourceInfo> {
  const source = new PMTilesTileSource(file.handle as string | Blob, {
    pmtiles: options?.pmtiles || {}
  });
  const formatSpecificMetadata = await source.getMetadata();
  const {tileMIMEType, tilejson = {}} = formatSpecificMetadata;
  const {layers = []} = tilejson;
  switch (tileMIMEType) {
    case 'application/vnd.mapbox-vector-tile':
      return {
        shape: 'vector-source',
        layers: layers.map(layer => ({name: layer.name, schema: layer.schema})),
        tables: [],
        formatSpecificMetadata
      } as VectorSourceInfo;
    case 'image/png':
    case 'image/jpeg':
      return {shape: 'image-source', formatSpecificMetadata} as ImageSourceInfo;
    default:
      throw new Error(`PMTilesLoader: Unsupported tile MIME type ${tileMIMEType}`);
  }
}
