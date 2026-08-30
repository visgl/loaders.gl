// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  draco_DataType,
  draco_EncodedGeometryType,
  draco_GeometryAttribute_Type,
  draco_StatusCode
} from '../src/draco3d/draco3d-types';

test('Draco WebIDL enums preserve the release-pinned numeric ABI', () => {
  expect(draco_GeometryAttribute_Type).toMatchObject({
    0: 'draco_GeometryAttribute::INVALID',
    1: 'draco_GeometryAttribute::POSITION',
    5: 'draco_GeometryAttribute::GENERIC'
  });
  expect(draco_EncodedGeometryType).toMatchObject({
    0: 'draco::INVALID_GEOMETRY_TYPE',
    1: 'draco::POINT_CLOUD',
    2: 'draco::TRIANGULAR_MESH'
  });
  expect(draco_DataType['draco::DT_FLOAT32']).toBe(9);
  expect(draco_DataType['draco::DT_TYPES_COUNT']).toBe(12);
  expect(draco_StatusCode['draco_Status::OK']).toBe(0);
  expect(draco_StatusCode['draco_Status::UNKNOWN_VERSION']).toBe(5);
});
