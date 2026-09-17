// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {
  createTile3DStyleInput,
  getTile3DBatchTableProperties,
  getTile3DStyleProperty
} from '@loaders.gl/3d-tiles';

const content = {
  index: 0,
  group: 1,
  payload: null,
  metadata: {properties: {material: 'content', shared: 'content'}},
  boundingVolume: null,
  featureIds: [],
  renderable: true
} as any;

test('createTile3DStyleInput merges metadata from broad to narrow scope', () => {
  const styleInput = createTile3DStyleInput(
    content,
    {
      tileset: {properties: {shared: 'tileset', dataset: 'city'}},
      group: {properties: {shared: 'group', district: 'central'}},
      tile: {properties: {shared: 'tile', height: 12}}
    },
    {featureId: 2}
  );

  expect(styleInput.properties).toEqual({
    shared: 'content',
    dataset: 'city',
    district: 'central',
    height: 12,
    material: 'content'
  });
  expect(styleInput.propertySources.shared).toBe('content-metadata');
  expect(styleInput.propertySources.dataset).toBe('tileset-metadata');
  expect(styleInput.metadata.tile).toEqual({properties: {shared: 'tile', height: 12}});
  expect(styleInput.featureId).toBe(2);
});

test('batch-table properties override metadata and include hierarchy-visible names', () => {
  const batchTable = {
    getPropertyNames: (featureId: number) => {
      expect(featureId).toBe(4);
      return ['shared', 'className'];
    },
    getProperty: (featureId: number, propertyName: string) => {
      expect(featureId).toBe(4);
      return propertyName === 'shared' ? 'batch' : 'Building';
    }
  };

  const styleInput = createTile3DStyleInput(
    content,
    {tile: {properties: {shared: 'tile'}}},
    {featureId: 4, batchTable}
  );

  expect(styleInput.properties.shared).toBe('batch');
  expect(styleInput.properties.className).toBe('Building');
  expect(styleInput.propertySources.shared).toBe('batch-table');
  expect(getTile3DStyleProperty(styleInput, 'className')).toBe('Building');
  expect(getTile3DStyleProperty(styleInput, 'missing')).toBeUndefined();
});

test('getTile3DBatchTableProperties skips undefined values', () => {
  const batchTable = {
    getPropertyNames: () => ['height', 'missing'],
    getProperty: (_featureId: number, propertyName: string) =>
      propertyName === 'height' ? 12 : undefined
  };

  expect(getTile3DBatchTableProperties(batchTable, 0)).toEqual({height: 12});
});

test('style input ignores invalid feature ids instead of querying a batch table', () => {
  const batchTable = {
    getPropertyNames: () => {
      throw new Error('should not be called');
    },
    getProperty: () => 1
  };

  const styleInput = createTile3DStyleInput(content, {}, {featureId: -1, batchTable});
  expect(styleInput.properties).toEqual({material: 'content', shared: 'content'});
});


test('style input resolves the selected content group and skips out-of-range rows', () => {
  const batchTable = {
    featureCount: 1,
    getPropertyNames: () => ['height'],
    getProperty: () => 12
  };
  const styleInput = createTile3DStyleInput(
    content,
    {
      groups: [{properties: {district: 'north'}}, {properties: {district: 'south'}}],
      group: {properties: {district: 'wrong'}}
    },
    {featureId: 4, batchTable}
  );

  expect(styleInput.properties.district).toBe('south');
  expect(styleInput.properties.height).toBeUndefined();
  expect(styleInput.metadata.group).toEqual({properties: {district: 'south'}});
});

test('style input treats prototype property names as ordinary data', () => {
  const styleInput = createTile3DStyleInput(
    {...content, metadata: {properties: {__proto__: 'authored'}}},
    {},
    {}
  );
  expect(getTile3DStyleProperty(styleInput, 'toString')).toBeUndefined();
  expect(styleInput.properties['__proto__']).toBeUndefined();
});
