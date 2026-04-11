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
type ImageBitmapConstructor = new (imageData: ImageDataType) => ImageBitmap;

/**
 * Parses an encoded image under Node.js using the installed loaders.gl image polyfills.
 * @param arrayBuffer - Encoded image bytes.
 * @param _options - Reserved for future Node-specific bitmap options.
 * @returns A Node.js `ImageBitmap` polyfill instance.
 */
export async function parseToNodeImage(
  arrayBuffer: ArrayBuffer,
  _options?: unknown
): Promise<ImageBitmap> {
  const {mimeType} = getBinaryImageMetadata(arrayBuffer) || {};

  // @ts-ignore
  const parseImageNode: ParseImageNode = globalThis.loaders?.parseImageNode;
  assert(parseImageNode); // '@loaders.gl/polyfills not installed'
  const NodeImageBitmap: ImageBitmapConstructor | undefined = (globalThis as any).ImageBitmap;
  if (!NodeImageBitmap) {
    throw new Error("Install '@loaders.gl/polyfills' to parse images under Node.js");
  }

  // @ts-expect-error TODO should we throw error in this case?
  const imageData = await parseImageNode(arrayBuffer, mimeType);
  return new NodeImageBitmap(imageData);
}
