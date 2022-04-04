import type {B3DMContent} from '@loaders.gl/3d-tiles';
import type {ConvertedAttributes} from '../types';
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {convertAttributes} from './geometry-converter';

type AttributesOptions = {
  useCartesianPostions: boolean;
};

export type AttributesTransformationOptions = WriterOptions & {
  attributesTransformations?: AttributesOptions & {
    useCartesianPostions: false;
  };
};

/**
 * Transform B3DM data to I3S attributes
 */
export const I3SAttributeTransformation: Writer = {
  name: 'I3S Attributes Transformation',
  id: 'i3s-attributes-transformation',
  module: 'tile-converter',
  version: VERSION,
  extensions: [],
  // @ts-expect-error - select apropriate type for such kind of transformation function.
  encode,
  options: {
    useCartesianPostions: false
  }
};

async function encode(
  data: B3DMContent,
  options: AttributesTransformationOptions
): Promise<Map<string, ConvertedAttributes>> {
  const {useCartesianPostions} = options;
  return convertAttributes(data, useCartesianPostions);
}
