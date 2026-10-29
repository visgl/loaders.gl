// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {readFile} from 'node:fs/promises';
import {
  encodeImageNode,
  encodeImageToStreamNode
} from '../../../src/polyfills/images/encode-image-node';
import {NODE_FORMAT_SUPPORT, parseImageNode} from '../../../src/polyfills/images/parse-image-node';

const IMAGE_FIXTURES = [
  ['@loaders.gl/images/test/data/img1-preview.png', 'image/png'],
  ['@loaders.gl/images/test/data/img1-preview.jpeg', 'image/jpeg'],
  ['@loaders.gl/images/test/data/img1-preview.gif', 'image/gif']
] as const;

test.each(IMAGE_FIXTURES)('parseImageNode decodes %s', async (url, mimeType) => {
  const filename = url.replace('@loaders.gl/images/', '../../../../images/');
  const image = await parseImageNode(
    (await readFile(new URL(filename, import.meta.url))) as any,
    mimeType
  );

  expect(image.data).toBeInstanceOf(Uint8Array);
  expect(image.width).toBeGreaterThan(0);
  expect(image.height).toBeGreaterThan(0);
  expect(image.components).toBeGreaterThanOrEqual(3);
  expect(NODE_FORMAT_SUPPORT).toContain(mimeType);
});

test('parseImageNode rejects invalid encoded bytes', async () => {
  await expect(parseImageNode(new ArrayBuffer(0))).rejects.toThrow();
});

test('encodeImageNode writes a tiny image with explicit and default formats', async () => {
  const image = {
    data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]),
    width: 2,
    height: 1
  };
  const png = (await encodeImageNode(image, {type: 'image/png'})) as ArrayBuffer;
  const jpeg = (await encodeImageNode(image, {})) as ArrayBuffer;

  expect(png.byteLength).toBeGreaterThan(0);
  expect(jpeg.byteLength).toBeGreaterThan(0);
  const chunks: Buffer[] = [];
  for await (const chunk of encodeImageToStreamNode(image, {type: 'png'})) {
    chunks.push(chunk);
  }
  expect(Buffer.concat(chunks)).toEqual(Buffer.from(png));
  const decoded = await parseImageNode(png);
  expect(Array.from(decoded.data)).toEqual(Array.from(image.data));
});

test('encodeImageToStreamNode forwards invalid format errors', async () => {
  const image = {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1};
  const stream = encodeImageToStreamNode(image, {type: 'unsupported-format'});
  await expect(async () => {
    for await (const _chunk of stream) {
      // Consume the stream so codec errors surface to the caller.
    }
  }).rejects.toThrow();
});

test.each(['webp', 'avif'])('Node image codecs support %s without a MIME hint', async type => {
  const image = {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1};
  const encodedImage = await encodeImageNode(image, {type});
  const decodedImage = await parseImageNode(encodedImage);
  expect(decodedImage).toMatchObject({width: 1, height: 1, components: 4});
  expect(decodedImage.data).toHaveLength(4);
});
