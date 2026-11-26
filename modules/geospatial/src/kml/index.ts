// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {KMLFormat, KMZFormat} from './kml-format';

export type {KMLLoaderOptions} from './kml-loader-types';
export {KMLLoader} from './kml-loader-types';

export type {KMZLoaderOptions} from './kmz-loader-types';
export {KMZLoader} from './kmz-loader-types';

export type {KMZArchive} from './kmz-archive';
export {
  openKMZArchive as _openKMZArchive,
  resolveKMZResourcePath as _resolveKMZResourcePath
} from './kmz-archive';

export type {KMZSourceOptions} from './kmz-source';
export {KMZVectorSource} from './kmz-source';

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
  parseKMLDocument as _parseKMLDocument
} from './kml-parser';

export {KMLLoaderWithParser, parseKMLTextToFeatureCollection} from './kml-loader';
