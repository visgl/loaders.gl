// SPDX-License-Identifier: MIT

import {loadSharp} from './load-sharp';

export {NODE_FORMAT_SUPPORT} from './node-image-formats';

/** Decoded Node image pixels and dimensions. */
type NodeImageData = {
  /** Pixel layout, including a frame dimension for animations. */
  shape: number[];
  /** Interleaved RGBA pixels. */
  data: Uint8Array;
  /** Frame width in pixels. */
  width: number;
  /** Frame height in pixels. */
  height: number;
  /** Number of components per pixel. */
  components: number;
  /** Number of animation frames. */
  layers: number[];
};

/** Decodes encoded image bytes into RGBA pixels, detecting the format from the bytes. */
export async function parseImageNode(
  arrayBuffer: ArrayBuffer,
  _mimeType?: string
): Promise<NodeImageData> {
  const sharp = await loadSharp();
  const {data, info: imageInformation} = await sharp(Buffer.from(arrayBuffer), {animated: true})
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  const width = imageInformation.width;
  const height = imageInformation.pageHeight || imageInformation.height;
  const frameCount = imageInformation.pages || 1;
  return {
    shape: frameCount > 1 ? [frameCount, width, height, 4] : [width, height, 4],
    data: new Uint8Array(data),
    width,
    height,
    components: 4,
    layers: [frameCount]
  };
}
