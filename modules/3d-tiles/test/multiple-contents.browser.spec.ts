import {describe, expect, test} from 'vitest';
import {Tiles3DTilesetSchema} from '../src/tileset-zod-schema';
import {normalizeTileData} from '../src/lib/parsers/parse-3d-tile-header';

describe('3D Tiles multiple contents', () => {
  test('accepts and preserves an array of content references', () => {
    const tileset = Tiles3DTilesetSchema.parse({
      asset: {version: '1.1'},
      geometricError: 10,
      root: {
        boundingVolume: {sphere: [0, 0, 0, 1]},
        geometricError: 1,
        content: [{uri: 'geometry.b3dm'}, {uri: 'attributes.json', extras: {kind: 'metadata'}}],
        children: []
      }
    });

    const normalizedTile = normalizeTileData(tileset.root, 'https://example.com/');

    expect(Array.isArray(normalizedTile?.content)).toBe(true);
    expect(normalizedTile?.contentUrls).toEqual([
      'https://example.com/geometry.b3dm',
      'https://example.com/attributes.json'
    ]);
    expect((normalizedTile?.content as Array<{extras?: {kind?: string}}>)[1].extras?.kind).toBe(
      'metadata'
    );
  });

  test('keeps single-content callers on the existing object shape', () => {
    const normalizedTile = normalizeTileData(
      {
        boundingVolume: {sphere: [0, 0, 0, 1]},
        geometricError: 1,
        content: {uri: 'tile.b3dm'},
        children: []
      },
      'https://example.com/'
    );

    expect(Array.isArray(normalizedTile?.content)).toBe(false);
    expect(normalizedTile?.contentUrl).toBe('https://example.com/tile.b3dm');
    expect(normalizedTile?.contentUrls).toEqual(['https://example.com/tile.b3dm']);
  });
});
