import {describe, expect, test} from 'vitest';
import {Tiles3DTilesetSchema} from '../src/tileset-zod-schema';
import {normalizeTileData} from '../src/lib/parsers/parse-3d-tile-header';

describe('3D Tiles metadata topology', () => {
  test('preserves schema, groups, and tileset metadata references', () => {
    const tileset = Tiles3DTilesetSchema.parse({
      asset: {version: '1.1'},
      schema: {
        classes: {building: {properties: {height: {type: 'SCALAR'}}}},
        enums: {status: {values: [{name: 'active', value: 1}]}}
      },
      groups: [{id: 'buildings', class: 'building', extras: {source: 'survey'}}],
      metadata: {
        id: 'city',
        class: 'dataset',
        properties: {jurisdiction: 'example'}
      },
      geometricError: 10,
      root: {
        boundingVolume: {sphere: [0, 0, 0, 1]},
        geometricError: 1,
        metadata: {id: 'root', class: 'building', properties: {height: 12}},
        content: {
          uri: 'building.glb',
          group: 0,
          metadata: {id: 'content', class: 'building', properties: {height: 12}}
        }
      }
    });

    const normalizedTile = normalizeTileData(tileset.root, 'https://example.com/');

    expect(tileset.schema?.classes?.building).toBeDefined();
    expect(tileset.groups?.[0]?.id).toBe('buildings');
    expect(tileset.metadata?.properties?.jurisdiction).toBe('example');
    expect(normalizedTile?.metadata?.id).toBe('root');
    expect(normalizedTile?.content?.group).toBe(0);
    expect(normalizedTile?.content?.metadata?.id).toBe('content');
  });

  test('accepts forward-compatible metadata fields without decoding them', () => {
    const result = Tiles3DTilesetSchema.safeParse({
      asset: {version: '1.1'},
      metadata: {
        class: 'future',
        properties: {binaryReference: {byteOffset: 16}},
        vendorField: {enabled: true}
      },
      geometricError: 0,
      root: {
        boundingVolume: {sphere: [0, 0, 0, 1]},
        geometricError: 0
      }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata?.vendorField).toEqual({enabled: true});
    }
  });
});
