import {beforeAll, describe, expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {parseSHPToArrow, parseSHPToArrowInBatches} from '../src/lib/parsers/parse-shp-to-arrow';

const POINTS_PATH = '@loaders.gl/shapefile/test/data/shapefile-js/points.shp';
let pointsBuffer: ArrayBuffer;

beforeAll(async () => {
  pointsBuffer = await (await fetchFile(POINTS_PATH)).arrayBuffer();
});

describe('parseSHPToArrow', () => {
  test('creates WKB and typed GeoArrow tables from SHP data', () => {
    const wkbTable = parseSHPToArrow(pointsBuffer, {shp: {shape: 'arrow-table'}});
    const typedTable = parseSHPToArrow(pointsBuffer, {
      shp: {shape: 'arrow-table', geoarrowEncoding: 'geoarrow'}
    });

    expect(wkbTable.data.numRows).toBeGreaterThan(0);
    expect(wkbTable.schema.fields[0].name).toBe('geometry');
    expect(typedTable.data.numRows).toBe(wkbTable.data.numRows);
    expect(typedTable.data.schema.fields[0].metadata.get('ARROW:extension:name')).toBe(
      'geoarrow.point'
    );
  });

  test('streams WKB Arrow batches and emits an empty terminal schema', async () => {
    const batches = [];
    for await (const batch of parseSHPToArrowInBatches([pointsBuffer], {
      shp: {shape: 'arrow-table'}
    })) {
      batches.push(batch);
    }
    expect(batches.length).toBeGreaterThan(0);
    expect(batches.reduce((count, batch) => count + batch.length, 0)).toBeGreaterThan(0);

    const emptyBatches = [];
    for await (const batch of parseSHPToArrowInBatches([], {shp: {shape: 'arrow-table'}})) {
      emptyBatches.push(batch);
    }
    expect(emptyBatches).toHaveLength(1);
    expect(emptyBatches[0].length).toBe(0);
  });

  test('rejects typed GeoArrow streaming output', async () => {
    /** Consumes the streaming parser to expose its unsupported-mode error. */
    const consume = async (): Promise<void> => {
      for await (const _batch of parseSHPToArrowInBatches([pointsBuffer], {
        shp: {shape: 'arrow-table', geoarrowEncoding: 'geoarrow'}
      })) {
        // Iteration triggers validation before any batch is emitted.
      }
    };
    await expect(consume()).rejects.toThrow('only supported for non-streaming parse');
  });
});
