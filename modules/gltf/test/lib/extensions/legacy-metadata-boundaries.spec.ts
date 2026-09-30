// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decode} from '../../../src/lib/extensions/deprecated/EXT_feature_metadata';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

test.each([
  ['missing schema', {}],
  ['missing collections', {schema: {classes: {building: {properties: {}}}}}],
  [
    'unmatched classes',
    {
      schema: {classes: {building: {properties: {}}}},
      featureTables: {other: {class: 'other', count: 0, properties: {}}},
      featureTextures: {other: {class: 'other', properties: {}}}
    }
  ]
])('legacy feature metadata tolerates %s without inventing data', async (_name, extension) => {
  const data = {
    json: {extensions: {EXT_feature_metadata: extension}}
  } as unknown as GLTFWithBuffers;
  const original = structuredClone(data.json);
  await decode(data, {gltf: {loadBuffers: true, loadImages: true}});
  expect(data.json).toEqual(original);
});
