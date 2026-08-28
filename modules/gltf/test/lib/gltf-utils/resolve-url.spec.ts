// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
// @ts-expect-error
import {resolveUrl} from '@loaders.gl/gltf/lib/gltf-utils/resolve-url';
test('resolveUrl#resolves relative urls against document urls', () => {
  expect(
    resolveUrl('buffer.bin', {core: {baseUrl: 'https://example.com/models/model.gltf'}}),
    'resolves relative URLs against the source document directory'
  ).toBe('https://example.com/models/buffer.bin');
  expect(
    resolveUrl('buffer.bin', {core: {baseUrl: 'https://example.com/models/'}}),
    'preserves directory base URLs'
  ).toBe('https://example.com/models/buffer.bin');
});
