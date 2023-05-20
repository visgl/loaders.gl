// POLYFILL: DOMParser
// - Node: Yes
// - Browser: No
import {isBrowser} from '@loaders.gl/loader-utils';
import xmldom from '@xmldom/xmldom';

if (!isBrowser && !('DOMParser' in globalThis) && xmldom.DOMParser) {
  globalThis['DOMParser'] = xmldom.DOMParser;
}

export type {GPXLoaderOptions} from './gpx-loader';
export {GPXLoader} from './gpx-loader';

export type {KMLLoaderOptions} from './kml-loader';
export {KMLLoader} from './kml-loader';

export type {TCXLoaderOptions} from './tcx-loader';
export {TCXLoader} from './tcx-loader';
