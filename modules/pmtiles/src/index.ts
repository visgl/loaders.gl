// import type {LoaderWithParser} from '@loaders.gl/loader-utils';
// import {parsePMTilesHeader, parsePMTile} from './lib/parse-pmtiles';
// import {PMTilesLoader as PMTilesWorkerLoader} from './pmtiles-loader';

// export {PMTilesWorkerLoader};

// /**
//  * Loader for PMTiles - Point Cloud Data
//  */
// export const PMTilesLoader: LoaderWithParser = {
//   ...PMTilesWorkerLoader,
//   parse: async (arrayBuffer: ArrayBuffer) => parsePMTilesHeader(arrayBuffer)
// };

// export {FetchSource} from './lib/sources';

export type {PMTilesImageSourceProps} from './pmtiles-source';
export {PMTilesImageSource} from './pmtiles-source';