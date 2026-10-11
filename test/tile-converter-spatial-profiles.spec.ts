// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Ellipsoid} from '@math.gl/geospatial';
import {
  createTiles3DConversionSpatialContext,
  createI3SConversionSpatialContext
} from '@loaders.gl/tile-converter/v5';

const CREATE_CONTEXTS = [createTiles3DConversionSpatialContext, createI3SConversionSpatialContext];

test.each([
  'EPSG:3857',
  'EPSG:4326',
  'EPSG:4978'
])('native %s retains positions, epoch and vertical metadata without reprojection', sourceCrs => {
  for (const createContext of CREATE_CONTEXTS) {
    const context = createContext({
      sourceCrs,
      coordinateFrame:
        sourceCrs === 'EPSG:4326'
          ? 'geographic'
          : sourceCrs === 'EPSG:4978'
            ? 'geocentric'
            : 'projected',
      coordinateEpoch: 2020.5,
      heightReference: 'orthometric',
      verticalUnitScale: 1
    });
    const input = new Float64Array([179.999, 1, 20.000001]);
    const output =
      'transformGeometryAsync' in context
        ? context.transformPositions(input, [0, 0, 0]).sourcePositions
        : context.transformPositions(input);
    expect(output).toEqual(input);
    expect(output).not.toBe(input);
    expect(context.spatialReference).toMatchObject({
      status: 'native',
      sourceCrs,
      coordinateEpoch: 2020.5,
      heightReference: 'orthometric',
      verticalUnitScale: 1
    });
  }
});

test.each([
  {positions: [0, 1]},
  {positions: [0, NaN, 1]},
  {positions: [0, Infinity, 1]}
])('native contexts reject malformed xyz $positions', ({positions}) => {
  for (const createContext of CREATE_CONTEXTS) {
    const context = createContext({coordinateFrame: 'local'});
    expect(() => context.transformPositions(positions, [0, 0, 0])).toThrow(/finite xyz/);
    expect(() => context.transformNormals([0, 0, 1], positions)).toThrow();
  }
});

test('native I3S offsets and normal APIs reject invalid inputs consistently', async () => {
  const context = createI3SConversionSpatialContext({coordinateFrame: 'local'});
  for (const origin of [
    [0, 0],
    [0, NaN, 0],
    [0, 0, 0, 1]
  ]) {
    expect(() => context.transformPositions([0, 0, 0], origin)).toThrow(/three finite/);
  }
  expect(() => context.transformPositions([1e40, 0, 0], [0, 0, 0])).toThrow(/float32/);
  for (const normals of [
    [0, 1],
    [0, NaN, 1]
  ]) {
    expect(() => context.transformNormals(normals, [0, 0, 0])).toThrow(/Normals/);
    await expect(context.transformGeometryAsync([0, 0, 0], normals)).rejects.toMatchObject({
      code: 'SPATIAL_INPUT_INVALID'
    });
  }
  expect(() => context.transformNormals([0, 0, 1], [0, 0, 0], 'unknown')).toThrow(
    /reference frame/
  );
});

test('native I3S direct and geometry normal APIs use the same declared vector basis', async () => {
  const context = createI3SConversionSpatialContext({
    sourceCrs: 'EPSG:4978',
    heightReference: 'ellipsoidal'
  });
  const positions = [6378137, 0, 0];
  const normals = [0, 0, 2];
  const direct = context.transformNormals(normals, positions, 'vertex-reference-frame');
  const geometry = await context.transformGeometryAsync(
    positions,
    normals,
    'vertex-reference-frame'
  );
  expect(direct).toEqual(geometry.normals);
  expect(direct[0]).toBeCloseTo(1, 5);
  expect(geometry.positions).toEqual(new Float64Array(positions));
});

test('geographic antimeridian coordinates become nearby ECEF vertices without longitude wrapping loss', () => {
  const context = createTiles3DConversionSpatialContext(
    {sourceCrs: 'EPSG:4326', heightReference: 'ellipsoidal'},
    {targetCrs: 'EPSG:4978'}
  );
  const input = [179.999, 0, 10.25, -179.999, 0, 10.25];
  const positions = context.transformPositions(input);
  for (let index = 0; index < input.length; index += 3) {
    const expected = Ellipsoid.WGS84.cartographicToCartesian(input.slice(index, index + 3));
    for (let axis = 0; axis < 3; axis++)
      expect(positions[index + axis]).toBeCloseTo(expected[axis], 6);
  }
  expect(
    Math.hypot(...positions.slice(0, 3).map((value, axis) => value - positions[axis + 3]))
  ).toBeLessThan(223);
});

test('epoch-changing reprojection stays explicitly unsupported for both contexts', () => {
  for (const createContext of CREATE_CONTEXTS) {
    expect(() =>
      createContext(
        {sourceCrs: 'EPSG:4326', coordinateEpoch: 2020.5, heightReference: 'ellipsoidal'},
        {targetCrs: 'EPSG:4978'}
      )
    ).toThrow(/epoch-aware/);
  }
});

test('native normal normalization handles zero and very large finite vectors without overflow', async () => {
  const context = createI3SConversionSpatialContext({coordinateFrame: 'local'});
  const positions = [0, 0, 0, 1, 1, 1];
  const normals = [0, 0, 0, 1.7e308, 1.7e308, 1.7e308];
  const output = context.transformNormals(normals, positions);
  expect(Array.from(output.slice(0, 3))).toEqual([0, 0, 0]);
  expect(Math.hypot(...output.slice(3))).toBeCloseTo(1, 6);
  expect((await context.transformGeometryAsync(positions, normals)).normals).toEqual(output);
});
