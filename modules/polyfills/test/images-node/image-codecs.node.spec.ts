// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {readFile} from 'node:fs/promises';
import {encodeImageNode, encodeImageToStreamNode} from '../../src/images/encode-image-node';
import {NODE_FORMAT_SUPPORT, parseImageNode} from '../../src/images/parse-image-node';

const IMAGE_FIXTURES = [
  ['@loaders.gl/images/test/data/img1-preview.png', 'image/png'],
  ['@loaders.gl/images/test/data/img1-preview.jpeg', 'image/jpeg'],
  ['@loaders.gl/images/test/data/img1-preview.gif', 'image/gif']
] as const;

test.each(IMAGE_FIXTURES)('parseImageNode decodes %s', async (url, mimeType) => {
  const filename = url.replace('@loaders.gl/images/', '../../../images/');
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

test('parseImageNode requires an explicit MIME type', async () => {
  await expect(parseImageNode(new ArrayBuffer(0), '')).rejects.toThrow(/MIMEType is required/);
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
  expect(encodeImageToStreamNode(image, {type: 'png'})).toBeTruthy();
});
