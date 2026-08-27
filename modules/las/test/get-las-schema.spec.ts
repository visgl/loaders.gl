// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {getLASSchema, makeMetadataFromLasHeader} from '../src/lib/get-las-schema';

const LAS_HEADER = {
  pointsOffset: 227,
  pointsFormatId: 3,
  pointsStructSize: 34,
  pointsCount: 2,
  scale: [0.01, 0.01, 0.01],
  offset: [100, 200, 300],
  totalToRead: 2,
  totalRead: 2,
  maxs: [10, 20, 30],
  mins: [1, 2, 3],
  versionAsString: '1.2',
  isCompressed: false
} as any;

test('makeMetadataFromLasHeader includes optional LAS metadata', () => {
  const metadata = makeMetadataFromLasHeader(LAS_HEADER);

  expect(metadata).toMatchObject({
    las_pointsOffset: '227',
    las_pointsFormatId: '3',
    las_pointsStructSize: '34',
    las_pointsCount: '2',
    las_scale: '[0.01,0.01,0.01]',
    las_offset: '[100,200,300]',
    las_maxs: '[10,20,30]',
    las_mins: '[1,2,3]',
    las_totalToRead: '2',
    las_versionAsString: '1.2',
    las_isCompressed: 'false'
  });
});

test('makeMetadataFromLasHeader omits absent optional values', () => {
  const metadata = makeMetadataFromLasHeader({
    ...LAS_HEADER,
    maxs: undefined,
    mins: undefined,
    versionAsString: undefined,
    isCompressed: undefined
  });

  expect(metadata.las_maxs).toBeUndefined();
  expect(metadata.las_mins).toBeUndefined();
  expect(metadata.las_versionAsString).toBeUndefined();
  expect(metadata.las_isCompressed).toBeUndefined();
});

test('getLASSchema carries LAS metadata into the mesh schema', () => {
  const attributes = {POSITION: {value: new Float32Array([0, 1, 2]), size: 3}};
  const schema = getLASSchema(LAS_HEADER, attributes);

  expect(schema.metadata?.las_pointsCount).toBe('2');
  expect(schema.fields[0].name).toBe('POSITION');
});
