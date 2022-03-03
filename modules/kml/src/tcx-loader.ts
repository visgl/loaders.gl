import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {geojsonToBinary} from '@loaders.gl/gis';
import {tcx} from '@tmcw/togeojson';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TCXLoaderOptions = LoaderOptions & {
  tcx?: {};
};

const TCX_HEADER = `\
<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase`;

/**
 * Loader for TCX (Training Center XML) - Garmin GPS track format
 */
export const TCXLoader = {
  name: 'TCX (Training Center XML)',
  id: 'tcx',
  module: 'kml',
  version: VERSION,
  extensions: ['tcx'],
  mimeTypes: ['application/vnd.garmin.tcx+xml'],
  text: true,
  tests: [TCX_HEADER],
  parse: async (arrayBuffer, options) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync,
  options: {
    tcx: {},
    gis: {format: 'geojson'}
  }
};

function parseTextSync(text: string, options: any = {}) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geojson = tcx(doc);

  // backwards compatibility
  const shape = options?.gis?.format || options?.tcx?.type || options?.tcx?.shape;

  switch (shape) {
    case 'geojson':
      return geojson;
    case 'binary':
      return geojsonToBinary(geojson.features);
    case 'raw':
      return doc;
    case 'object-row-table':
      return geojson.features;
    default:
      throw new Error(shape);
  }
}

export const _typecheckTCXLoader: LoaderWithParser = TCXLoader;
