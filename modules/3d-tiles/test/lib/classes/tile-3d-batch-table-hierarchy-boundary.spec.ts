// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import Tile3DBatchTable from '../../../src/lib/classes/tile-3d-batch-table';
import {
  initializeHierarchy,
  traverseHierarchy
} from '../../../src/lib/classes/tile-3d-batch-table-hierarchy';

const SINGLE_PARENT_HIERARCHY = {
  instancesLength: 3,
  classIds: [0, 1, 2],
  parentIds: [1, 2, 2],
  classes: [
    {name: 'door', length: 1, instances: {name: ['front'], width: [2]}},
    {name: 'building', length: 1, instances: {name: ['library'], height: [20]}},
    {name: 'district', length: 1, instances: {district: ['central']}}
  ]
};

const MULTIPLE_PARENT_HIERARCHY = {
  instancesLength: 4,
  classIds: [0, 1, 1, 2],
  parentCounts: [2, 1, 1, 0],
  parentIds: [1, 2, 3, 3],
  classes: [
    {name: 'window', length: 1, instances: {window: ['w0']}},
    {name: 'door', length: 2, instances: {door: ['left', 'right']}},
    {name: 'building', length: 1, instances: {building: ['root']}}
  ]
};

/** Creates a batch table backed by the supplied hierarchy extension. */
function createBatchTable(hierarchy: Record<string, any>): Tile3DBatchTable {
  return new Tile3DBatchTable(
    {
      height: [1, 2, 3, 4],
      extensions: {'3DTILES_batch_table_hierarchy': hierarchy}
    },
    null,
    Number(hierarchy.instancesLength),
    {'3DTILES_batch_table_hierarchy': true}
  );
}

test('batch table hierarchy reads, classifies, and mutates owned properties', () => {
  const batchTable = createBatchTable(SINGLE_PARENT_HIERARCHY);

  expect(batchTable.memorySizeInBytes()).toBe(0);
  expect(batchTable.getExtension('3DTILES_batch_table_hierarchy')).toBe(SINGLE_PARENT_HIERARCHY);
  expect(batchTable.isExactClass(0, 'door')).toBe(true);
  expect(batchTable.isExactClass(0, 'building')).toBe(false);
  expect(batchTable.isClass(0, 'district')).toBe(true);
  expect(batchTable.isClass(0, 'missing')).toBe(false);
  expect(batchTable.getExactClassName(0)).toBe('door');
  expect(batchTable.hasProperty(0, 'height')).toBe(true);
  expect(batchTable.hasProperty(0, 'district')).toBe(true);
  expect(batchTable.hasProperty(0, 'missing')).toBe(false);
  expect(batchTable.getProperty(0, 'name')).toBe('front');
  expect(batchTable.getProperty(0, 'district')).toBe('central');
  expect(batchTable.getProperty(0, 'missing')).toBeUndefined();
  expect(batchTable.getPropertyNames(0).sort()).toEqual(['district', 'height', 'name', 'width']);

  batchTable.setProperty(0, 'name', 'side');
  expect(batchTable.getProperty(0, 'name')).toBe('side');
  expect(() => batchTable.setProperty(0, 'district', 'west')).toThrow('read-only');
  batchTable.setProperty(0, 'newProperty', 7);
  expect(batchTable.getProperty(0, 'newProperty')).toBe(7);
});

test('multiple-parent traversal visits a diamond once and can stop early', () => {
  const batchTable = createBatchTable(MULTIPLE_PARENT_HIERARCHY);
  const hierarchy = batchTable._hierarchy;
  const visited: number[] = [];

  expect(
    traverseHierarchy(hierarchy, 0, (_hierarchy, instanceIndex) => {
      visited.push(instanceIndex);
      return undefined;
    })
  ).toBeNull();
  expect(visited.sort()).toEqual([0, 1, 2, 3]);
  expect(
    traverseHierarchy(hierarchy, 0, (_hierarchy, index) => (index === 2 ? 'hit' : undefined))
  ).toBe('hit');
  expect(batchTable.getProperty(0, 'building')).toBe('root');
  expect(batchTable.getPropertyNames(0).sort()).toEqual(['building', 'door', 'height', 'window']);
});

test('hierarchy initialization handles absent, legacy, and binary index metadata', () => {
  expect(initializeHierarchy({getExtension: () => undefined}, null, null)).toBeNull();
  expect(initializeHierarchy({getExtension: () => undefined}, {}, null)).toBeNull();
  expect(traverseHierarchy(null, 0, () => true)).toBeUndefined();

  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const legacyJson = {HIERARCHY: SINGLE_PARENT_HIERARCHY};
  const legacy = initializeHierarchy({getExtension: () => undefined}, legacyJson, null);
  expect(legacy.classes).toHaveLength(3);
  expect(legacyJson.extensions['3DTILES_batch_table_hierarchy']).toBe(SINGLE_PARENT_HIERARCHY);
  expect(warning).toHaveBeenCalledOnce();
  warning.mockRestore();

  const binaryBody = new Uint8Array(16);
  new Uint16Array(binaryBody.buffer).set([0, 1, 2, 1, 1, 0, 1, 2]);
  const binaryHierarchy = initializeHierarchy(
    {
      getExtension: () => ({
        instancesLength: 3,
        classIds: {byteOffset: 0},
        parentCounts: {byteOffset: 6},
        parentIds: {byteOffset: 12},
        classes: [
          {name: 'a', length: 1, instances: {a: ['a']}},
          {name: 'b', length: 1, instances: {b: ['b']}},
          {name: 'c', length: 1, instances: {c: ['c']}}
        ]
      })
    },
    {},
    binaryBody
  );
  expect(Array.from(binaryHierarchy.classIds)).toEqual([0, 1, 2]);
  expect(Array.from(binaryHierarchy.parentCounts)).toEqual([1, 1, 0]);
  expect(Array.from(binaryHierarchy.parentIds)).toEqual([1, 2]);
});

test('hierarchy validation rejects cycles, out-of-range parents, and binary class properties', () => {
  const makeBatchTable = hierarchy => () => createBatchTable(hierarchy);
  expect(
    makeBatchTable({
      instancesLength: 2,
      classIds: [0, 0],
      parentIds: [1, 0],
      classes: [{name: 'node', length: 2, instances: {name: ['a', 'b']}}]
    })
  ).toThrow('Circular dependency');
  expect(
    makeBatchTable({
      instancesLength: 1,
      classIds: [0],
      parentIds: [2],
      classes: [{name: 'node', length: 1, instances: {name: ['a']}}]
    })
  ).toThrow('exceeds the total number');
  expect(
    makeBatchTable({
      instancesLength: 1,
      classIds: [0],
      classes: [
        {name: 'node', length: 1, instances: {binary: {byteOffset: 0, componentType: 5123}}}
      ]
    })
  ).toThrow('Binary hierarchy property binary is not supported yet');
});
