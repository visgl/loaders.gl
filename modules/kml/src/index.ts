// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {KMLFormat, KMZFormat, GPXFormat, TCXFormat} from './kml-format';
export type {GPXLoaderOptions} from './gpx-loader';
export {GPXLoader} from './gpx-loader';

export type {KMLLoaderOptions} from './kml-loader';
export {KMLLoader} from './kml-loader';

export type {KMZLoaderOptions} from './kmz-loader';
export {KMZLoader} from './kmz-loader';

export type {KMZArchive} from './kmz-archive';
export {openKMZArchive, resolveKMZResourcePath} from './kmz-archive';

export type {KMZSourceOptions} from './kmz-source';
export {KMZSourceLoader, KMZVectorSource} from './kmz-source';

export type {KMLWriterData, KMLWriterOptions, KMZWriterOptions} from './kml-writer';
export {KMLWriter, KMZWriter, encodeKMLText} from './kml-writer';

export type {
  KMLDocument,
  KMLFeatureConversionOptions,
  KMLFolder,
  KMLModel,
  KMLNetworkLink,
  KMLOverlay,
  KMLStyle
} from './kml-parser';
export {
  convertKMLDocumentToFeatureCollection,
  parseKMLDocument
} from './kml-parser';

export type {TCXLoaderOptions} from './tcx-loader';
export {TCXLoader} from './tcx-loader';
