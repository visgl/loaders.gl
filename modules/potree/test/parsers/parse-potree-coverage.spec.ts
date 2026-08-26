// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {parsePotreeBin} from '../../src/parsers/parse-potree-bin';
import {
  buildPotreeHierarchyFromMetadata,
  parsePotreeHierarchyChunk
} from '../../src/parsers/parse-potree-hierarchy-chunk';

describe('Potree parser branches', () => {
  test('builds binary hierarchies from breadth-first child masks', () => {
    const buffer = new ArrayBuffer(15);
    const view = new DataView(buffer);
    view.setUint8(0, 0b00001001);
    view.setUint32(1, 10, true);
    view.setUint8(5, 0);
    view.setUint32(6, 4, true);
    view.setUint8(10, 0);
    view.setUint32(11, 2, true);

    const root = parsePotreeHierarchyChunk(buffer);

    expect(root.pointCount).toBe(10);
    expect(root.header.childMask).toBe(0b00001001);
    expect(root.header.childCount).toBe(2);
    expect(root.childrenByIndex[0]?.name).toBe('0');
    expect(root.childrenByIndex[3]?.name).toBe('3');
    expect(root.childrenByIndex[0]?.hasChildren).toBe(false);
  });

  test('builds inline hierarchies and rejects missing parents', () => {
    const root = buildPotreeHierarchyFromMetadata(
      [
        ['r', 10],
        ['r0', 4],
        ['r03', 2]
      ],
      {spacing: 8}
    );

    expect(root.childrenByIndex[0]?.spacing).toBe(4);
    expect(root.childrenByIndex[0]?.childrenByIndex[3]?.spacing).toBe(2);
    expect(() => buildPotreeHierarchyFromMetadata([['r1', 1]])).toThrow('missing root node');
    expect(() =>
      buildPotreeHierarchyFromMetadata([
        ['r', 1],
        ['r7', 1],
        ['r72', 1]
      ])
    ).not.toThrow();
    expect(() =>
      buildPotreeHierarchyFromMetadata([
        ['r', 1],
        ['r72', 1]
      ])
    ).toThrow('missing parent node r7');
  });

  test('decodes positions, packed colors, skipped attributes, and Arrow output', () => {
    const pointAttributes = [
      'POSITION_CARTESIAN',
      'RGB_PACKED',
      'RGBA_PACKED',
      'COLOR_PACKED',
      'INTENSITY',
      'NORMAL_SPHEREMAPPED',
      'NORMAL_OCT16',
      'CLASSIFICATION',
      'FILLER_1B',
      'NORMAL_FLOATS',
      'NORMAL'
    ] as any;
    const pointByteSize = 55;
    const buffer = new ArrayBuffer(pointByteSize);
    const view = new DataView(buffer);
    view.setInt32(0, 100, true);
    view.setInt32(4, -200, true);
    view.setInt32(8, 300, true);
    for (let offset = 12; offset < pointByteSize; offset++) {
      view.setUint8(offset, offset);
    }

    const mesh = parsePotreeBin(buffer, 0, {
      potree: {
        pointAttributes,
        scale: 0.5,
        positionOrigin: [1, 2, 3],
        nodeBoundingBox: [
          [0, 0, 0],
          [10, 10, 10]
        ]
      }
    }) as any;
    expect(Array.from(mesh.attributes.POSITION.value)).toEqual([51, -98, 153]);
    expect(Array.from(mesh.attributes.COLOR_0.value)).toEqual([19, 20, 21]);
    expect(mesh.header.boundingBox).toEqual([
      [51, -98, 153],
      [51, -98, 153]
    ]);

    const table = parsePotreeBin(buffer, 0, {
      potree: {pointAttributes, shape: 'arrow-table'}
    }) as any;
    expect(table.schema).toBeDefined();
    expect(table.data).toBeDefined();
  });

  test('rejects incomplete Potree records and missing metadata', () => {
    expect(() => parsePotreeBin(new ArrayBuffer(1))).toThrow('requires pointAttributes');
    expect(() =>
      parsePotreeBin(new ArrayBuffer(1), 0, {potree: {pointAttributes: ['RGBA_PACKED'] as any}})
    ).toThrow('not divisible by 4');
    expect(() =>
      parsePotreeBin(new ArrayBuffer(1), 0, {potree: {pointAttributes: ['UNKNOWN'] as any}})
    ).toThrow('Unsupported Potree point attribute');
  });
});
