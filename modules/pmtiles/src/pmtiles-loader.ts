import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {LayerSchemas} from '@loaders.gl/mvt';
import {getSchemasFromTileJSON} from '@loaders.gl/mvt';
import {PMTilesSource} from './pmtiles-source';
import {VERSION} from './lib/version';

export type PMTilesLoaderOptions = LoaderOptions & {
  pmtiles?: {};
};

/**
 * Loader for PMTiles metadata
 * @note This loader is mainly intended to allow PMTiles to be treated like other file types in a top-level logic.
 * For actual access to the tile data, use the PMTilesSource class directly.
 */
export const PMTilesLoader: LoaderWithParser<LayerSchemas, never, PMTilesLoaderOptions> = {
  name: 'PMTiles',
  id: 'pmtiles',
  module: 'pmtiles',
  version: VERSION,
  extensions: ['pmtiles'],
  mimeTypes: ['application/octet-stream'],
  options: {
    pmtiles: {}
  },
  parse: async (arrayBuffer, options): Promise<LayerSchemas> => {
    const source = new PMTilesSource({url: new Blob([arrayBuffer]), ...options});
    const metadata = await source.getMetadata();
    if (metadata.tilejson) {
      return getSchemasFromTileJSON(metadata.tilejson);
    }
    return {metadata: {}, layers: []};
  }
};
