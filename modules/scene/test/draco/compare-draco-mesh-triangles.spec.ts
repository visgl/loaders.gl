// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {hasSameDracoMeshTriangles} from '@loaders.gl/scene/api';

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

test('large Draco meshes compare exact ranked faces across reordered and unused vertices', () => {
  const source = {
    POSITION: {size: 3, value: new Float32Array([-0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0])},
    _FEATURE_ID_0: {size: 1, value: new Uint32Array([0, 0, 0, 16_777_217])}
  };
  const decoded = {
    POSITION: {size: 3, value: new Float32Array([1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 8, 8, 8])},
    _FEATURE_ID_0: {size: 1, value: new Uint32Array([16_777_217, 0, 0, 0, 0])}
  };
  const indices = new Uint32Array(65_536 * 3);
  const reordered = new Uint32Array(indices.length);
  const sourceFaces = [0, 1, 2, 2, 1, 3];
  const decodedFaces = [2, 0, 1, 1, 3, 2];
  for (let offset = 0; offset < indices.length; offset += 6) {
    indices.set(sourceFaces, offset);
    reordered.set(decodedFaces, offset);
  }
  const names = Object.keys(source);
  expect(hasSameDracoMeshTriangles(source, indices, decoded, reordered, names)).toBe(true);

  reordered.set([1, 0, 2]);
  expect(hasSameDracoMeshTriangles(source, indices, decoded, reordered, names)).toBe(false);
  reordered.set([1, 3, 2]);
  expect(hasSameDracoMeshTriangles(source, indices, decoded, reordered, names)).toBe(false);
  reordered.set([2, 0, 4]);
  expect(hasSameDracoMeshTriangles(source, indices, decoded, reordered, names)).toBe(false);
  reordered.set([2, 0, 1]);
  decoded._FEATURE_ID_0.value[0]--;
  expect(hasSameDracoMeshTriangles(source, indices, decoded, reordered, names)).toBe(false);
});
