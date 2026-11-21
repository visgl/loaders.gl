// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {hasSameDracoMeshTriangles} from '@loaders.gl/scene/draco';

test('Draco triangle verification preserves winding, multiplicity and vertex attributes', () => {
  const attributes = {
    POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0])},
    _FEATURE_ID_0: {size: 1, value: new Uint32Array([0, 0, 0, 1])}
  };
  const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);
  const reorderedIndices = new Uint16Array([1, 3, 2, 2, 0, 1]);
  const names = Object.keys(attributes);
  expect(hasSameDracoMeshTriangles(attributes, indices, attributes, reorderedIndices, names)).toBe(
    true
  );
  expect(
    hasSameDracoMeshTriangles(
      attributes,
      indices,
      attributes,
      new Uint16Array([0, 2, 1, 2, 1, 3]),
      names
    )
  ).toBe(false);
  expect(
    hasSameDracoMeshTriangles(
      attributes,
      indices,
      attributes,
      new Uint16Array([0, 1, 2, 0, 1, 2]),
      names
    )
  ).toBe(false);
  expect(
    hasSameDracoMeshTriangles(
      attributes,
      indices,
      {...attributes, _FEATURE_ID_0: {size: 1, value: new Uint32Array([0, 0, 1, 0])}},
      reorderedIndices,
      names
    )
  ).toBe(false);
  expect(
    hasSameDracoMeshTriangles(
      attributes,
      indices,
      {POSITION: attributes.POSITION},
      reorderedIndices,
      names
    )
  ).toBe(false);
});
