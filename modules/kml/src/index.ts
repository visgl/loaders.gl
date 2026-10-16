// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {KMLFormat, KMZFormat, GPXFormat, TCXFormat} from '@loaders.gl/geospatial/kml/index';
export type {GPXLoaderOptions} from '@loaders.gl/geospatial/kml/index';
export {GPXLoader} from '@loaders.gl/geospatial/kml/index';

export type {KMLLoaderOptions} from '@loaders.gl/geospatial/kml/index';
export {KMLLoader} from '@loaders.gl/geospatial/kml/index';

export type {KMZLoaderOptions} from '@loaders.gl/geospatial/kml/index';
export {KMZLoader} from '@loaders.gl/geospatial/kml/index';

export type {KMZArchive} from '@loaders.gl/geospatial/kml/index';
export {openKMZArchive, resolveKMZResourcePath} from '@loaders.gl/geospatial/kml/index';

export type {KMZSourceOptions} from '@loaders.gl/geospatial/kml/index';
export {KMZSourceLoader, KMZVectorSource} from '@loaders.gl/geospatial/kml/index';

export type {
  KMLWriterData,
  KMLWriterOptions,
  KMZWriterOptions
} from '@loaders.gl/geospatial/kml/index';
export {KMLWriter, KMZWriter, encodeKMLText} from '@loaders.gl/geospatial/kml/index';

export type {
  KMLDocument,
  KMLFeatureConversionOptions,
  KMLFolder,
  KMLModel,
  KMLNetworkLink,
  KMLOverlay,
  KMLStyle
} from '@loaders.gl/geospatial/kml/index';
export {
  convertKMLDocumentToFeatureCollection,
  parseKMLDocument
} from '@loaders.gl/geospatial/kml/index';

export type {TCXLoaderOptions} from '@loaders.gl/geospatial/kml/index';
export {TCXLoader} from '@loaders.gl/geospatial/kml/index';
