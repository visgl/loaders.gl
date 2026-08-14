// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {Tiles3DTilesetSchema} from '@loaders.gl/3d-tiles/tileset-zod-schema';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

describe('Tiles3DTilesetSchema', () => {
  it('accepts recursive tilesets and preserves extension properties', () => {
    const tileset = Tiles3DTilesetSchema.parse({
      asset: {version: '1.1'},
      geometricError: 100,
      root: {
        boundingVolume: {sphere: [0, 0, 0, 1]},
        geometricError: 10,
        children: [
          {
            boundingVolume: {box: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]},
            geometricError: 0,
            content: {url: 'tile.glb'}
          }
        ]
      },
      vendor: {enabled: true}
    });

    expect(tileset.root.children?.[0]?.content?.url).toBe('tile.glb');
    expect(tileset.vendor).toEqual({enabled: true});
  });

  it('rejects malformed required metadata', () => {
    expect(Tiles3DTilesetSchema.safeParse({geometricError: 1}).success).toBe(false);
    expect(
      Tiles3DTilesetSchema.safeParse({
        asset: {version: '1.1'},
        geometricError: -1,
        root: {boundingVolume: {sphere: [0, 0, 0]}, geometricError: 0}
      }).success
    ).toBe(false);
  });

  it('rejects conflicting inline and external metadata schemas', () => {
    expect(
      Tiles3DTilesetSchema.safeParse({
        asset: {version: '1.1'},
        schema: {},
        schemaUri: 'metadata.schema.json',
        geometricError: 1,
        root: {boundingVolume: {sphere: [0, 0, 0, 1]}, geometricError: 0}
      }).success
    ).toBe(false);
  });

  it('can be exported as JSON Schema', () => {
    const jsonSchema = z.toJSONSchema(Tiles3DTilesetSchema, {target: 'draft-7'});
    const serializedJsonSchema = JSON.stringify(jsonSchema);

    expect(jsonSchema.required).toEqual(
      expect.arrayContaining(['asset', 'geometricError', 'root'])
    );
    expect(serializedJsonSchema).toContain('boundingVolume');
  });
});
