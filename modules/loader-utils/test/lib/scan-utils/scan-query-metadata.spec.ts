// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createScanQueryMetadata} from '../../../src';

describe('createScanQueryMetadata', () => {
  test('derives immutable panel columns from a schema', () => {
    const metadata = createScanQueryMetadata({
      sourceType: 'example',
      queryType: 'table',
      schema: {
        fields: [
          {
            name: 'id',
            type: 'int64',
            nullable: false,
            metadata: {title: 'Feature ID', description: 'Stable identifier'}
          },
          {name: 'geometry', type: 'binary', nullable: true}
        ],
        metadata: {format: 'example'}
      },
      columnRoles: {id: 'identifier', geometry: 'geometry'},
      capabilities: {
        table: {
          projection: 'pushdown',
          predicate: 'residual',
          limit: 'residual',
          streaming: true,
          cancellation: true
        },
        bounds: 'pushdown'
      },
      spatial: {
        bounds: {minimum: [-180, -90], maximum: [180, 90]},
        coordinateReferenceSystems: ['EPSG:4326']
      },
      statistics: {rowCount: 12n}
    });

    expect(metadata.columns).toEqual([
      {
        name: 'id',
        type: 'int64',
        nullable: false,
        role: 'identifier',
        title: 'Feature ID',
        description: 'Stable identifier',
        metadata: {title: 'Feature ID', description: 'Stable identifier'}
      },
      {
        name: 'geometry',
        type: 'binary',
        nullable: true,
        role: 'geometry',
        title: undefined,
        description: undefined,
        metadata: {}
      }
    ]);
    expect(metadata.spatial?.bounds).toEqual({
      minimum: [-180, -90],
      maximum: [180, 90]
    });
    expect(Object.isFrozen(metadata)).toBe(true);
    expect(Object.isFrozen(metadata.columns)).toBe(true);
    expect(Object.isFrozen(metadata.schema.fields)).toBe(true);
  });
});
