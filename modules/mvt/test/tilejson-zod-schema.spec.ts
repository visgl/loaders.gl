// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile} from '@loaders.gl/core';
import {TileJSONMetadataSchema} from '@loaders.gl/mvt/tilejson-zod-schema';
import {describe, expect, it} from 'vitest';
import {z} from 'zod';

const TIPPECANOE_TILEJSON = '@loaders.gl/mvt/test/data/tilejson/tippecanoe.tilejson';

describe('TileJSONMetadataSchema', () => {
  it('accepts partial Tippecanoe TileJSON with Tilestats', async () => {
    const metadata = await (await fetchFile(TIPPECANOE_TILEJSON)).json();
    const parsedMetadata = TileJSONMetadataSchema.parse(metadata);

    expect(parsedMetadata.vector_layers?.[0]?.id).toBe('input');
    expect(parsedMetadata.tilestats?.layers?.[0]?.attributes?.length).toBeGreaterThan(0);
  });

  it('rejects invalid known property types', () => {
    expect(TileJSONMetadataSchema.safeParse({tiles: [42]}).success).toBe(false);
    expect(TileJSONMetadataSchema.safeParse({scheme: 'quadkey'}).success).toBe(false);
    expect(TileJSONMetadataSchema.safeParse({tilestats: {layers: 'input'}}).success).toBe(false);
  });

  it('preserves extension properties', () => {
    const metadata = TileJSONMetadataSchema.parse({
      tiles: ['https://example.com/{z}/{x}/{y}.mvt'],
      vendor: {enabled: true}
    });

    expect(metadata.vendor).toEqual({enabled: true});
  });

  it('can be exported as JSON Schema', () => {
    const jsonSchema = z.toJSONSchema(TileJSONMetadataSchema, {target: 'draft-7'});
    const serializedJsonSchema = JSON.stringify(jsonSchema);

    expect(serializedJsonSchema).toContain('vector_layers');
    expect(serializedJsonSchema).toContain('tilestats');
  });
});
