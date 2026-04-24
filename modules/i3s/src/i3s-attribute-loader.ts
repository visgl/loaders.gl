import type {Loader} from '@loaders.gl/loader-utils';
import type {I3SLoaderOptions} from './i3s-loader';
import type {I3STileAttributes} from './lib/parsers/parse-i3s-attribute';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loader for I3S attributes
 */
export const I3SAttributeLoader = {
  dataType: null as unknown as I3STileAttributes,
  batchType: null as never,
  name: 'I3S Attribute',
  id: 'i3s-attribute',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/binary'],
  /** Loads the parser-bearing I3S attribute loader implementation. */
  preload: async () => (await import('./i3s-attribute-loader-with-parser')).I3SAttributeLoaderWithParser,
  extensions: ['bin'],
  options: {},
  binary: true
} as const satisfies Loader<I3STileAttributes, never, I3SLoaderOptions>;

/**
 * Loads I3S attributes based on feature id using the parser-bearing implementation.
 */
export async function loadFeatureAttributes(tile, featureId, options = {}) {
  return (await import('./i3s-attribute-loader-with-parser')).loadFeatureAttributes(tile, featureId, options);
}

/**
 * Get attribute value type based on property names.
 */
export function getAttributeValueType(attribute) {
  if (attribute.hasOwnProperty('objectIds')) {
    return 'Oid32';
  } else if (attribute.hasOwnProperty('attributeValues')) {
    return attribute.attributeValues.valueType;
  }
  return '';
}
