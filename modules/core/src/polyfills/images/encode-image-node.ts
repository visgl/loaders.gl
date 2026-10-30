// SPDX-License-Identifier: MIT

import {PassThrough} from 'node:stream';
import {loadSharp} from './load-sharp';
import {toArrayBuffer} from '../utils/buffer-utils';

/** Raw RGBA image accepted by the Node encoder. */
type NodeImageData = {
  /** Interleaved RGBA pixels. */
  data: Uint8Array;
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
};

/** Options for the Node image encoder. */
type NodeImageEncoderOptions = {
  /** Output format name or MIME type; defaults to JPEG. */
  type?: string;
  /** Legacy option retained for callers. */
  dataURI?: string;
};

/** Encodes raw RGBA pixels with the optional Sharp backend. */
export async function encodeImageNode(
  image: NodeImageData,
  options: NodeImageEncoderOptions = {}
): Promise<ArrayBuffer> {
  const sharp = await loadSharp();
  const requestedFormat = (options.type || 'jpeg').toLowerCase().replace(/^image\//, '');
  const format = requestedFormat === 'jpg' ? 'jpeg' : requestedFormat;
  const encodedImage = await sharp(Buffer.from(image.data), {
    raw: {width: image.width, height: image.height, channels: 4}
  })
    .toFormat(format as keyof import('sharp').FormatEnum)
    .toBuffer();
  return toArrayBuffer(encodedImage);
}

/** Streams an encoded image and forwards codec loading and encoding failures. */
export function encodeImageToStreamNode(
  image: NodeImageData,
  options: NodeImageEncoderOptions = {}
): PassThrough {
  const stream = new PassThrough();
  void encodeImageNode(image, options).then(
    arrayBuffer => stream.end(Buffer.from(arrayBuffer)),
    error => stream.destroy(error)
  );
  return stream;
}
