import type {ImageLoaderOptions} from '../../image-loader';
import type {ImageDataType} from '../../types';
import {assert} from '@loaders.gl/loader-utils';
import {getBinaryImageMetadata} from '../category-api/binary-image-api';

// Note: These types should be consistent with loaders.gl/polyfills

type NDArray = {
  shape: number[];
  data: Uint8Array;
  width: number;
  height: number;
  components: number;
  layers: number[];
};

type ParseImageNode = (arrayBuffer: ArrayBuffer, mimeType: string) => Promise<NDArray>;

// Use polyfills if installed to parsed image using get-pixels
export default async function parseToNodeImage(
  arrayBuffer: ArrayBuffer,
  options: ImageLoaderOptions
): Promise<ImageDataType> {
  const {mimeType} = getBinaryImageMetadata(arrayBuffer) || {};

  // @ts-ignore
  const _parseImageNode: ParseImageNode = globalThis._parseImageNode;
  assert(_parseImageNode); // '@loaders.gl/polyfills not installed'

  // @ts-expect-error TODO should we throw error in this case?
  return await _parseImageNode(arrayBuffer, mimeType);
}
