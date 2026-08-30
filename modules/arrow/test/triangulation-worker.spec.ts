// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {beforeAll, expect, test, vi} from 'vitest';

const workerMocks = vi.hoisted(() => ({
  getTriangleIndices: vi.fn(),
  convertGeoArrow: vi.fn(),
  triangulateWKBColumn: vi.fn()
}));

vi.mock('@loaders.gl/geoarrow', async importOriginal => {
  const original = await importOriginal<typeof import('@loaders.gl/geoarrow')>();
  return {
    ...original,
    getTriangleIndices: workerMocks.getTriangleIndices,
    convertGeoArrowToBinaryFeatureCollection: workerMocks.convertGeoArrow
  };
});

vi.mock('../src/triangulate-wkb-geometry-column', () => ({
  triangulateWKBGeometryColumn: workerMocks.triangulateWKBColumn
}));

let processMessage: (data: unknown) => Promise<any>;

beforeAll(async () => {
  ({processTriangulationWorkerMessage: processMessage} = await import(
    '../src/workers/triangulation-worker'
  ));
});

test('triangulation worker echoes probes and rejects unsupported operations', async () => {
  await expect(processMessage({operation: 'test', value: 1})).resolves.toEqual({
    operation: 'test',
    value: 1
  });
  await expect(processMessage({operation: 'unknown'})).rejects.toThrow(
    'Unsupported operation unknown'
  );
});

test('triangulation worker appends generated polygon indices', async () => {
  workerMocks.getTriangleIndices.mockReturnValue(new Uint32Array([0, 1, 2]));
  const input = {
    operation: 'triangulate',
    polygonIndices: {value: new Uint32Array([0]), size: 1},
    primitivePolygonIndices: {value: new Uint32Array([0]), size: 1},
    flatCoordinateArray: new Float64Array([0, 0, 1, 0, 0, 1]),
    nDim: 2
  };

  const result = await processMessage(input);
  expect(result.triangleIndices).toEqual(new Uint32Array([0, 1, 2]));
  workerMocks.getTriangleIndices.mockReturnValue(null);
  expect(await processMessage(input)).not.toHaveProperty('triangleIndices');
});

test('triangulation worker rebuilds and serializes WKB Arrow columns', async () => {
  const geometryVector = arrow.vectorFromArray([new Uint8Array([1, 2])], new arrow.Binary());
  const indexVector = arrow.vectorFromArray([0, 1, 2], new arrow.Uint32());
  const vertexVector = arrow.vectorFromArray([0, 0, 1, 0, 0, 1], new arrow.Float64());
  workerMocks.triangulateWKBColumn.mockReturnValue({
    vertexIndices: indexVector,
    vertices: vertexVector
  });

  const result = await processMessage({
    operation: 'triangulate-wkb-column',
    chunkIndex: 3,
    chunkData: serializeData(geometryVector.data[0])
  });

  expect(result.chunkIndex).toBe(3);
  expect(result.vertexIndexColumn.length).toBe(3);
  expect(result.vertexColumn.length).toBe(6);
});

test('triangulation worker rebuilds GeoArrow batches and preserves chunk identity', async () => {
  const geometryVector = arrow.vectorFromArray([1, 2, 3], new arrow.Int32());
  const binaryData = {shape: 'binary-feature-collection'};
  workerMocks.convertGeoArrow.mockReturnValue(binaryData);

  const result = await processMessage({
    operation: 'parse-geoarrow',
    chunkIndex: 4,
    chunkOffset: 10,
    chunkData: serializeData(geometryVector.data[0]),
    geometryEncoding: 'geoarrow.point',
    calculateMeanCenters: true,
    triangle: false
  });

  expect(result).toEqual({binaryDataFromGeoArrow: binaryData, chunkIndex: 4});
  expect(workerMocks.convertGeoArrow).toHaveBeenCalledWith(expect.anything(), 'geoarrow.point', {
    calculateMeanCenters: true,
    triangle: false,
    chunkIndex: 0,
    chunkOffset: 10
  });
});

function serializeData(data: arrow.Data): any {
  return {
    type: data.type,
    offset: data.offset,
    length: data.length,
    nullCount: data.nullCount,
    buffers: data.buffers,
    children: data.children.map(serializeData),
    dictionary: data.dictionary
  };
}
