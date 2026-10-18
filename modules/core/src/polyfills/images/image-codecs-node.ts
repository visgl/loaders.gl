// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {parseImageNode as parseImageImplementation} from './parse-image-node';
import type {encodeImageNode as encodeImageImplementation} from './encode-image-node';

export {NODE_FORMAT_SUPPORT} from './node-image-formats';

/** Loads the optional image decoder only when pixel decoding is requested. */
export async function parseImageNode(
  ...parameters: Parameters<typeof parseImageImplementation>
): Promise<Awaited<ReturnType<typeof parseImageImplementation>>> {
  let decoder: typeof import('./parse-image-node');
  try {
    decoder = await import('./parse-image-node');
  } catch (error) {
    throw new Error(
      'Node image decoding requires get-pixels. Install get-pixels to decode images.',
      {cause: error}
    );
  }
  return decoder.parseImageNode(...parameters);
}

/** Loads the optional image encoder only when image encoding is requested. */
export async function encodeImageNode(
  ...parameters: Parameters<typeof encodeImageImplementation>
): Promise<Awaited<ReturnType<typeof encodeImageImplementation>>> {
  let encoder: typeof import('./encode-image-node');
  try {
    encoder = await import('./encode-image-node');
  } catch (error) {
    throw new Error(
      'Node image encoding requires save-pixels and ndarray. Install save-pixels and ndarray to encode images.',
      {cause: error}
    );
  }
  return encoder.encodeImageNode(...parameters);
}
