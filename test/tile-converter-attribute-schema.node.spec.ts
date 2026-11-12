import {expect, test, vi} from 'vitest';
import type {Attribute} from '@loaders.gl/tiles-3d/i3s';
import type {FeatureTableJson} from '@loaders.gl/tiles-3d/3d-tiles';
import I3SConverter from '../apps/tile-converter/src/v4/i3s-converter/i3s-converter';
import {AttributeMetadataInfo} from '../apps/tile-converter/src/v4/i3s-converter/helpers/attribute-metadata-info';
import {collectBatchTableAttributeTypes} from '../apps/tile-converter/src/v4/i3s-converter/helpers/feature-attributes';
import {convertPropertyTableToAttributeBuffers} from '../apps/tile-converter/src/v4/i3s-converter/helpers/geometry-converter';
import {loadTile3DContent} from '../apps/tile-converter/src/v4/i3s-converter/helpers/load-3d-tiles';
import {Progress} from '../apps/tile-converter/src/v4/i3s-converter/helpers/progress';

vi.mock('../apps/tile-converter/src/v4/i3s-converter/helpers/load-3d-tiles', () => ({
  isNestedTileset: () => false,
  loadTile3DContent: vi.fn(async (_tileset, tile) => ({batchTableJson: tile.properties}))
}));
vi.mock('../apps/tile-converter/src/v4/i3s-converter/helpers/preprocess-3d-tiles', () => ({
  analyzeTileContent: async () => ({
    meshTopologyTypes: new Set(['TRIANGLES']),
    metadataClasses: new Set()
  }),
  mergePreprocessData: (target, source) => {
    for (const type of source.meshTopologyTypes) target.meshTopologyTypes.add(type);
  }
}));

/** Decodes the I3S string layout, preserving null versus empty string. */
function decodeStrings(buffer: ArrayBuffer): (string | null)[] {
  const header = new DataView(buffer);
  const count = header.getUint32(0, true);
  let offset = 8 + 4 * count;
  return Array.from({length: count}, (_, index) => {
    const length = header.getUint32(8 + 4 * index, true);
    const value = length
      ? new TextDecoder().decode(new Uint8Array(buffer, offset, length - 1))
      : null;
    offset += length;
    return value;
  });
}

const tables: FeatureTableJson[] = [
  {a: ['a1', 'a2'], b: ['b1', 'b2'], c: ['c1', 'c2']},
  {c: ['c3', 'c4'], a: ['a3', 'a4'], b: ['b3', 'b4']},
  {x: ['x5', 'x6'], y: [5.5, 6.5], z: ['z5', 'z6']}
];

test('legacy I3S preprocessing discovers later fields before any node buffers are written', async () => {
  const converter = new I3SConverter();
  converter.progresses['phase1-count'] = new Progress();
  converter.sourceTileset = {
    root: {
      children: tables.map((properties, index) => ({id: String(index), properties, children: []}))
    }
  } as never;
  // Exercise the real traversal and schema collection; mock only source I/O and topology analysis.
  expect(await converter['preprocessConversion']()).toBe(true);
  const enqueue = vi.spyOn(converter.writeQueue, 'enqueue').mockResolvedValue();
  vi.spyOn(converter.conversionDump, 'updateDoneStatus').mockImplementation(() => {});
  const schema = converter.attributeMetadataInfo.attributeStorageInfo;
  expect(schema.map(field => field.name)).toEqual(['OBJECTID', 'a', 'b', 'c', 'x', 'y', 'z']);
  for (const [index, table] of tables.entries()) {
    const buffers = convertPropertyTableToAttributeBuffers(
      [index * 2, index * 2 + 1],
      {},
      table,
      schema
    );
    expect(buffers).toHaveLength(schema.length);
    enqueue.mockClear();
    await converter['_writeAttributes'](buffers, '/unused', `nodes/${index}`, String(index), index);
    expect(enqueue.mock.calls.map(([item]) => item.archiveKey)).toEqual(
      schema.map(field => `nodes/${index}/attributes/${field.key}.bin.gz`)
    );
    for (const [fieldIndex, field] of schema.entries()) {
      if (field.name === 'OBJECTID') continue;
      const expected = table[field.name] || [null, null];
      if (field.attributeValues?.valueType === 'Float64') {
        const values = Array.from(new Float64Array(buffers[fieldIndex], 8));
        expect(values).toEqual(expected.map(value => value ?? Number.NaN));
      } else {
        expect(decodeStrings(buffers[fieldIndex])).toEqual(expected);
      }
    }
  }
});

test('legacy I3S aligns missing columns and preserves zero, empty and negative values', () => {
  const metadata = new AttributeMetadataInfo();
  metadata.addMetadataInfo({text: 'string', integer: 'Int32', real: 'double', missing: 'string'});
  const buffers = convertPropertyTableToAttributeBuffers(
    [0, 1, 2],
    {},
    {
      real: [null, 0, -0.5],
      integer: [null, 0, -1],
      text: [null, '', 'null'],
      OBJECTID: [99, 99, 99]
    },
    metadata.attributeStorageInfo
  );
  expect(Array.from(new Uint32Array(buffers[0], 4))).toEqual([0, 1, 2]);
  expect(decodeStrings(buffers[1])).toEqual([null, '', 'null']);
  expect(Array.from(new Int32Array(buffers[2], 4))).toEqual([-2147483648, 0, -1]);
  expect(Array.from(new Float64Array(buffers[3], 8))).toEqual([Number.NaN, 0, -0.5]);
  expect(decodeStrings(buffers[4])).toEqual([null, null, null]);
  const subset = convertPropertyTableToAttributeBuffers(
    [10, 11],
    {1: 10, 2: 11},
    {
      text: ['unused', '', 'null'],
      integer: [1, 0, -1],
      real: [1, 0, -0.5]
    },
    metadata.attributeStorageInfo
  );
  expect(decodeStrings(subset[1])).toEqual(['', 'null']);
  expect(Array.from(new Int32Array(subset[2], 4))).toEqual([0, -1]);
});

test('batch-table schema inference widens numbers across tiles and defers null-only columns', () => {
  const types = new Map<string, Attribute | null>();
  collectBatchTableAttributeTypes({number: [1, null], later: [null], mixed: [1]}, types);
  collectBatchTableAttributeTypes(
    {number: [2.5], later: [2], mixed: ['text'], large: [2147483648], minimum: [-2147483648]},
    types
  );
  expect(Object.fromEntries(types)).toEqual({
    number: 'double',
    later: 'Int32',
    mixed: 'string',
    large: 'double',
    minimum: 'double'
  });
});

test('legacy I3S emits a complete null row set for a tile without properties', () => {
  const metadata = new AttributeMetadataInfo();
  metadata.addMetadataInfo({text: 'string', integer: 'Int32', real: 'double'});
  const buffers = convertPropertyTableToAttributeBuffers(
    [4, 5],
    {},
    {},
    metadata.attributeStorageInfo
  );
  expect(Array.from(new Uint32Array(buffers[0], 4))).toEqual([4, 5]);
  expect(decodeStrings(buffers[1])).toEqual([null, null]);
  expect(Array.from(new Int32Array(buffers[2], 4))).toEqual([-2147483648, -2147483648]);
  expect(Array.from(new Float64Array(buffers[3], 8))).toEqual([Number.NaN, Number.NaN]);
});

test('legacy I3S stops before writing nodes when preprocessing cannot discover all fields', async () => {
  const converter = new I3SConverter();
  converter.progresses['phase1-count'] = new Progress();
  converter.sourceTileset = {
    root: {id: 'failed', contentUrl: 'failed.b3dm', children: []}
  } as never;
  vi.mocked(loadTile3DContent).mockRejectedValueOnce(new Error('temporary read failure'));
  await expect(converter['preprocessConversion']()).rejects.toThrow(
    'cannot determine the complete attribute schema'
  );
});
