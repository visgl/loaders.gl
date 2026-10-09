// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createTilesetSpatialReference, I3SSpatialTransformer} from '@loaders.gl/tiles';
import {I3SContentLoader} from '@loaders.gl/i3s';
import {parseI3STileContent} from '../src/lib/parsers/parse-i3s-tile-content';

/** One triangle with source XYZ offsets and earth-centered normals, without feature data. */
function createGeometry(): ArrayBuffer {
  const buffer = new ArrayBuffer(80);
  new DataView(buffer).setUint32(0, 3, true);
  new Float32Array(buffer, 8, 9).set([0, 0, 0.125, 1, 0, 0.125, 0, 1, 0.125]);
  new Float32Array(buffer, 44, 9).set([1, 0, 0, 1, 0, 0, 1, 0, 0]);
  return buffer;
}
/** Minimal uncompressed schema with a declared source frame. */
const SCHEMA = {
  store: {
    normalReferenceFrame: 'earth-centered',
    defaultGeometrySchema: {
      header: [
        {property: 'vertexCount', type: 'UInt32'},
        {property: 'featureCount', type: 'UInt32'}
      ],
      ordering: ['position', 'normal'],
      vertexAttributes: {
        position: {valueType: 'Float32', valuesPerElement: 3},
        normal: {valueType: 'Float32', valuesPerElement: 3}
      },
      featureAttributeOrder: [],
      featureAttributes: {}
    }
  }
};

test.each([
  'EPSG:3857',
  'EPSG:4326'
] as const)('source geometry retains absolute %s doubles and original vector basis', async sourceCrs => {
  const reference = createTilesetSpatialReference(
    {sourceCrs, heightReference: 'orthometric'},
    {targetCrs: 'EPSG:4978', targetHeightReference: 'ellipsoidal'}
  );
  const sourceOrigin = sourceCrs === 'EPSG:4326' ? -122.000001 : 10000000.000001;
  const transform = vi.spyOn(I3SSpatialTransformer.prototype, 'transformPositionsAsync');
  try {
    const content = await parseI3STileContent(
      createGeometry(),
      {mbs: [sourceOrigin, 20, 10, 1], isDracoGeometry: false, attributeUrls: []},
      {...SCHEMA, spatialReference: reference} as any,
      {i3s: {geometryMode: 'source'}} as any
    );
    expect(content.attributes.positions.value).toBeInstanceOf(Float64Array);
    expect(Array.from(content.attributes.positions.value).slice(0, 3)).toEqual([
      sourceOrigin,
      20,
      10.125
    ]);
    expect(content.sourceAttributes!.position).toBe(content.attributes.positions);
    expect(Array.from(content.attributes.normals.value)).toEqual([1, 0, 0, 1, 0, 0, 1, 0, 0]);
    expect(content.normalReferenceFrame).toBe('earth-centered');
    expect(content.coordinateSystem).toBe(sourceCrs === 'EPSG:4326' ? 'lnglat' : 'cartesian');
    expect(content.spatialReference).toMatchObject({
      sourceCrs,
      status: 'native',
      heightReference: 'orthometric',
      targetHeightReference: 'native'
    });
    expect(content.spatialReference!.targetCrs).toBeUndefined();
    expect(reference.targetCrs).toBe('EPSG:4978');
    expect(content.origin).toEqual([0, 0, 0]);
    expect(Array.from(content.modelMatrix)).toEqual([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
    ]);
    expect(transform).not.toHaveBeenCalled();
  } finally {
    transform.mockRestore();
  }
});

test('source geometry is opt-in and malformed source coordinates fail explicitly', async () => {
  expect(I3SContentLoader.options.i3s.geometryMode).toBe('render');
  const render = await parseI3STileContent(
    createGeometry(),
    {mbs: [0, 0, 0, 1], isDracoGeometry: false, attributeUrls: []},
    SCHEMA as any
  );
  expect(render.geometryMode).toBe('render');
  expect(render.sourceAttributes).toBeUndefined();
  const tile = {mbs: [NaN, 0, 0, 1], isDracoGeometry: false, attributeUrls: []} as any;
  await expect(
    parseI3STileContent(
      createGeometry(),
      tile,
      SCHEMA as any,
      {i3s: {geometryMode: 'source'}} as any
    )
  ).rejects.toThrow('finite source origin');
  await expect(
    parseI3STileContent(
      createGeometry(),
      tile,
      SCHEMA as any,
      {i3s: {geometryMode: 'unknown'}} as any
    )
  ).rejects.toThrow('geometry mode');
  const buffer = createGeometry();
  new Float32Array(buffer, 8, 9)[0] = Infinity;
  tile.mbs = [0, 0, 0, 1];
  await expect(
    parseI3STileContent(buffer, tile, SCHEMA as any, {i3s: {geometryMode: 'source'}} as any)
  ).rejects.toThrow('positions must be finite');
});

test('source Draco geometry reconstructs scales once and retains unknown producer attributes', async () => {
  const geometry = {
    header: {vertexCount: 3},
    loaderData: {attributes: {}},
    attributes: {
      POSITION: {
        size: 3,
        value: new Float32Array([1, 2, 3, 2, 2, 3, 1, 3, 3]),
        metadata: {'i3s-scale_x': {double: 0}, 'i3s-scale_y': {double: 2}}
      },
      NORMAL: {size: 3, value: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0])},
      CUSTOM: {size: 1, value: new Float32Array([4, 5, 6])}
    }
  };
  const content = await parseI3STileContent(
    new ArrayBuffer(0),
    {mbs: [10, 20, 30, 1], isDracoGeometry: true, attributeUrls: []},
    SCHEMA as any,
    {i3s: {geometryMode: 'source'}} as any,
    {_parse: async () => geometry, coreApi: {}} as any
  );
  expect(Array.from(content.attributes.positions.value).slice(0, 3)).toEqual([10, 24, 33]);
  expect(content.sourceAttributes!.CUSTOM).toBe(geometry.attributes.CUSTOM);
  expect(Array.from(geometry.attributes.POSITION.value).slice(0, 3)).toEqual([1, 2, 3]);
});

test('source geometry rejects unresolved encoded position layouts', async () => {
  const geometry = {
    header: {vertexCount: 3},
    loaderData: {attributes: {}},
    attributes: {
      POSITION: {
        size: 3,
        value: new Float32Array(9),
        transform: {quantizationBits: 12}
      }
    }
  };
  await expect(
    parseI3STileContent(
      new ArrayBuffer(0),
      {mbs: [0, 0, 0, 1], isDracoGeometry: true, attributeUrls: []},
      SCHEMA as any,
      {i3s: {geometryMode: 'source'}} as any,
      {_parse: async () => geometry, coreApi: {}} as any
    )
  ).rejects.toThrow('packed xyz');
});
