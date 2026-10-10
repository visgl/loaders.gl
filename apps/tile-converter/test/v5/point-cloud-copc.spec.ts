// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {openCOPC, loadCOPCHierarchyPage, loadCOPCNodeData} from '@loaders.gl/copc';
import {decodeLAZChunk} from '@loaders.gl/loader-utils';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import type {Mesh} from '@loaders.gl/schema';
import {convertTileset} from '../../src/v5/conversion-api';
import {mapPointCloudAttributes} from '../../src/v5/point-cloud-attributes';
import {
  encodePointCloudCOPC,
  createCOPCConversionCodec,
  type EncodePointCloudCOPCOptions
} from '../../src/v5/point-cloud-copc';

/** Tiny LAS-style source with an explicitly omitted stable identifier. */
function createInput(): Mesh {
  return {
    topology: 'point-list',
    mode: 0,
    schema: {fields: [], metadata: {}},
    attributes: {
      xyz: {value: new Float64Array([100.125, 200.25, 300.5, 101, 201, 301]), size: 3},
      rgb: {value: new Uint16Array([65535, 514, 771, 257, 65535, 1028]), size: 3, normalized: true},
      INTENSITY: {value: new Uint16Array([123, 65535]), size: 1},
      CLASSIFICATION: {value: new Uint8Array([2, 255]), size: 1},
      featureId: {
        value: new BigUint64Array([9007199254740993n, 9007199254740994n]),
        size: 1
      } as never
    }
  };
}

/** Explicit absolute local coordinate profile; no source placement is inferred. */
function createOptions(): EncodePointCloudCOPCOptions {
  return {
    mapping: {
      attributes: {
        POSITION: 'xyz',
        COLOR_0: 'rgb',
        intensity: 'INTENSITY',
        classification: 'CLASSIFICATION'
      },
      drop: {
        featureId: 'Stable IDs are retained by the application until COPC Extra Bytes is qualified'
      }
    },
    scale: [0.001, 0.001, 0.001],
    offset: [100, 200, 300],
    wkt: 'LOCAL_CS["converter conformance"]',
    maxPositionError: 0.001,
    organization: {nodePointLimit: 1, maximumDepth: 4, hierarchyPageDepth: 1}
  };
}

test('point mapping preserves typed values and records only explicitly authorized losses', () => {
  const input = createInput(),
    mapping = createOptions().mapping;
  const mapped = mapPointCloudAttributes(input, mapping);
  expect(mapped.mesh.attributes.POSITION.value).toBe(input.attributes.xyz.value);
  expect(mapped.mesh.attributes.COLOR_0.normalized).toBe(true);
  expect(mapped.droppedAttributes).toEqual(mapping.drop);
  expect(input.attributes).toHaveProperty('featureId');
  const retained = mapPointCloudAttributes(input, {
    attributes: {...mapping.attributes, stableId: 'featureId'}
  });
  expect(retained.mesh.attributes.stableId.value[0]).toBe(9007199254740993n);
});

test.each([
  {attributes: {POSITION: 'missing'}},
  {
    attributes: {COLOR_0: 'rgb'},
    drop: {xyz: 'omitted', INTENSITY: 'omitted', CLASSIFICATION: 'omitted', featureId: 'omitted'}
  },
  {attributes: createOptions().mapping.attributes},
  {attributes: createOptions().mapping.attributes, drop: {featureId: ''}},
  {
    attributes: createOptions().mapping.attributes,
    drop: {featureId: 'omitted', missing: 'omitted'}
  },
  {attributes: createOptions().mapping.attributes, drop: {xyz: 'omitted', featureId: 'omitted'}}
])('point mapping rejects incomplete or contradictory loss declarations %j', mapping => {
  expect(() => mapPointCloudAttributes(createInput(), mapping)).toThrow();
});

test('COPC adapter preserves positions, uint16 color, intensity, classification and declared CRS', async () => {
  const input = createInput(),
    options = createOptions();
  const encoded = await encodePointCloudCOPC(input, options);
  expect(encoded.pointCount).toBe(2);
  expect(encoded.maximumPositionError).toBe(0);
  expect(encoded.droppedAttributes).toEqual(options.mapping.drop);
  const getBytes = async (begin: number, end: number) =>
    new Uint8Array(encoded.copc.slice(begin, end));
  const file = await openCOPC(getBytes);
  expect(file.header.pointDataRecordFormat).toBe(7);
  expect(file.header.pointCount).toBe(2);
  expect(file.wkt).toBe(options.wkt);
  const pending = [file.info.rootHierarchyPage],
    rows: {position: number[]; rgb: number[]; intensity: number; classification: number}[] = [];
  while (pending.length) {
    const hierarchy = await loadCOPCHierarchyPage(getBytes, pending.pop()!);
    pending.push(...Object.values(hierarchy.pages));
    for (const node of Object.values(hierarchy.nodes)) {
      const bytes = await loadCOPCNodeData(getBytes, node);
      const raw = decodeLAZChunk(bytes, {
        pointCount: node.pointCount,
        pointDataRecordFormat: file.header.pointDataRecordFormat,
        pointDataRecordLength: file.header.pointDataRecordLength
      });
      const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
      for (let row = 0; row < node.pointCount; row++) {
        const offset = row * file.header.pointDataRecordLength;
        rows.push({
          position: options.offset.map(
            (origin, axis) => origin + view.getInt32(offset + axis * 4, true) * options.scale[axis]
          ),
          rgb: [0, 1, 2].map(axis => view.getUint16(offset + 30 + axis * 2, true)),
          intensity: view.getUint16(offset + 12, true),
          classification: view.getUint8(offset + 16)
        });
      }
    }
  }
  rows.sort((left, right) => left.position[0] - right.position[0]);
  expect(rows).toEqual([
    {position: [100.125, 200.25, 300.5], rgb: [65535, 514, 771], intensity: 123, classification: 2},
    {position: [101, 201, 301], rgb: [257, 65535, 1028], intensity: 65535, classification: 255}
  ]);
  expect(input.attributes.xyz.value[0]).toBe(100.125);
});

test('COPC adapter accepts Arrow and selects PDRF 6 without color or 8 with NIR', async () => {
  const input = createInput(),
    options = createOptions();
  await expect(
    encodePointCloudCOPC(convertMeshToTable(input, 'arrow-table'), options)
  ).resolves.toHaveProperty('pointCount', 2);
  const noColor = {
    ...options,
    mapping: {
      attributes: {POSITION: 'xyz'},
      drop: {rgb: 'omitted', INTENSITY: 'omitted', CLASSIFICATION: 'omitted', featureId: 'omitted'}
    }
  };
  const plain = await encodePointCloudCOPC(input, noColor);
  expect(new DataView(plain.copc).getUint8(104) & 63).toBe(6);
  input.attributes.nir = {value: new Uint16Array([42, 43]), size: 1};
  const infrared = await encodePointCloudCOPC(input, {
    ...options,
    mapping: {...options.mapping, attributes: {...options.mapping.attributes, nir: 'nir'}}
  });
  expect(new DataView(infrared.copc).getUint8(104) & 63).toBe(8);
});

test.each([
  {scale: [0, 1, 1]},
  {offset: [Infinity, 0, 0]},
  {wkt: ''},
  {maxPositionError: -1},
  {maxInputBytes: 0},
  {maxInputBytes: 1},
  {maxPoints: 0},
  {maxPoints: 1},
  {maxOutputBytes: 0},
  {maxOutputBytes: 1}
])('COPC adapter enforces explicit options and budgets %j', invalid => {
  return expect(
    encodePointCloudCOPC(createInput(), {...createOptions(), ...invalid} as never)
  ).rejects.toThrow();
});

test('COPC adapter rejects unsupported IDs, lossy values, layouts, coordinate range and precision', async () => {
  const input = createInput(),
    options = createOptions();
  await expect(
    encodePointCloudCOPC(input, {
      ...options,
      mapping: {attributes: {...options.mapping.attributes, stableId: 'featureId'}}
    })
  ).rejects.toThrow('cannot preserve');
  for (const attribute of [
    {value: new Float64Array([-1, 2]), size: 1},
    {value: new Float64Array([1.5, 2]), size: 1},
    {value: new BigInt64Array([1n, 2n]), size: 1}
  ]) {
    input.attributes.INTENSITY = attribute as never;
    await expect(encodePointCloudCOPC(input, options)).rejects.toThrow('qualified range');
  }
  input.attributes.INTENSITY = {value: new Uint16Array([1, 2]), size: 1, byteStride: 4};
  await expect(encodePointCloudCOPC(input, options)).rejects.toThrow('packed');
  const precision = {...options, scale: [1, 1, 1] as const, maxPositionError: 0};
  await expect(encodePointCloudCOPC(createInput(), precision)).rejects.toThrow('rounding');
  await expect(
    encodePointCloudCOPC(createInput(), {...options, offset: [1e20, 0, 0]})
  ).rejects.toThrow('int32');
  const color = createInput();
  color.attributes.rgb = {value: new Uint8Array(8), size: 4};
  await expect(encodePointCloudCOPC(color, options)).rejects.toThrow('RGB');
  const controller = new AbortController();
  controller.abort(new Error('stop COPC'));
  await expect(
    encodePointCloudCOPC(createInput(), {...options, signal: controller.signal})
  ).rejects.toThrow('stop COPC');
});

test('v5 COPC codec participates in write/finalize and abort lifecycles', async () => {
  const resources: ArrayBuffer[] = [],
    lifecycle: string[] = [];
  const report = await convertTileset({
    source: {
      inspect: async () => ({}),
      async *read() {
        yield createInput();
      }
    },
    codec: createCOPCConversionCodec(createOptions()),
    sink: {
      async write(resource) {
        resources.push(resource.copc);
      },
      async finalize() {
        lifecycle.push('finalize');
      },
      async abort() {
        lifecycle.push('abort');
      }
    },
    measureInputBytes: input =>
      Object.values(input.attributes).reduce(
        (bytes, attribute) => bytes + attribute.value.byteLength,
        0
      ),
    measureOutputBytes: resource => resource.copc.byteLength
  });
  expect(resources).toHaveLength(1);
  expect(lifecycle).toEqual(['finalize']);
  expect(report.outputResources).toBe(1);
  await expect(
    convertTileset({
      source: {
        inspect: async () => ({}),
        async *read() {
          yield createInput();
        }
      },
      codec: createCOPCConversionCodec({...createOptions(), maxOutputBytes: 1}),
      sink: {
        async write() {},
        async finalize() {},
        async abort() {
          lifecycle.push('abort');
        }
      },
      measureInputBytes: () => 1,
      measureOutputBytes: resource => resource.copc.byteLength
    })
  ).rejects.toThrow('budget');
  expect(lifecycle.at(-1)).toBe('abort');
});

test('COPC adapter preserves exact stable IDs with explicit Extra Bytes metadata', async () => {
  const options = createOptions();
  const encoded = await encodePointCloudCOPC(createInput(), {
    ...options,
    mapping: {attributes: {...options.mapping.attributes, stableId: 'featureId'}},
    extraBytes: [{attribute: 'stableId', name: 'point_id'}]
  });
  expect(encoded.droppedAttributes).toEqual({});
  const getBytes = async (begin: number, end: number) =>
    new Uint8Array(encoded.copc.slice(begin, end));
  const file = await openCOPC(getBytes);
  expect(file.header.pointDataRecordLength).toBe(44);
  await expect(
    encodePointCloudCOPC(createInput(), {...options, extraBytes: [{attribute: 'missing'}]})
  ).rejects.toThrow('Extra Bytes');
  await expect(
    encodePointCloudCOPC(createInput(), {...options, extraBytes: [{attribute: 'intensity'}]})
  ).rejects.toThrow('standard');
});

test('COPC adapter rejects overflowing cube coordinates and duplicate descriptor names', async () => {
  const input = createInput();
  input.attributes.xyz.value = new Float64Array(6).fill(1e308);
  await expect(
    encodePointCloudCOPC(input, {
      ...createOptions(),
      scale: [1e292, 1e292, 1e292],
      offset: [1e308, 1e308, 1e308]
    })
  ).rejects.toThrow('extent overflow');
  input.attributes.xyz.value = new Float64Array([-1.6e308, 0, 0, 1.6e308, 0, 0]);
  await expect(
    encodePointCloudCOPC(input, {
      ...createOptions(),
      scale: [1e300, 1e300, 1e300],
      offset: [0, 0, 0],
      maxPositionError: 1e295
    })
  ).rejects.toThrow('extent overflow');
  const options = createOptions();
  await expect(
    encodePointCloudCOPC(createInput(), {
      ...options,
      mapping: {
        attributes: {...options.mapping.attributes, stableId: 'featureId', anotherId: 'featureId'}
      },
      extraBytes: [
        {attribute: 'stableId', name: 'id'},
        {attribute: 'anotherId', name: 'id'}
      ]
    })
  ).rejects.toThrow('Extra Bytes');
});
