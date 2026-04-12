import {expect, test} from 'vitest';
import {isLoaderObject, normalizeLoader} from '@loaders.gl/core/lib/loader-utils/normalize-loader';
import * as threeDTiles from '@loaders.gl/3d-tiles';
import * as arrow from '@loaders.gl/arrow';
import * as csv from '@loaders.gl/csv';
import * as draco from '@loaders.gl/draco';
import * as tables from '@loaders.gl/schema-utils';
import * as gltf from '@loaders.gl/gltf';
import * as images from '@loaders.gl/images';
import * as kml from '@loaders.gl/kml';
import * as las from '@loaders.gl/las';
import * as obj from '@loaders.gl/obj';
import * as pcd from '@loaders.gl/pcd';
import * as ply from '@loaders.gl/ply';
import * as zip from '@loaders.gl/zip';
const modules = [
  threeDTiles,
  arrow,
  csv,
  draco,
  tables,
  gltf,
  images,
  kml,
  las,
  obj,
  pcd,
  ply,
  zip
];
test('isLoaderObject', () => {
  // @ts-ignore
  expect(isLoaderObject(null), 'null is not a loader').toBeFalsy();
  for (const module of modules) {
    for (const exportName in module) {
      if (exportName.endsWith('Loader')) {
        expect(isLoaderObject(module[exportName]), `${exportName} should be a loader`).toBeTruthy();
      }
    }
  }
  expect([csv.CSVLoader, {header: false}], 'loader-option array').toBeTruthy();
});
test('normalizeLoader', () => {
  const TESTS = [
    {
      title: 'loader',
      input: obj.OBJLoader
    },
    {
      title: 'loader with options',
      input: [images.ImageLoader, {image: {imageOrientation: 'flipY'}}],
      options: {image: {imageOrientation: 'flipY'}}
    }
  ];
  for (const testCase of TESTS) {
    // TODO
    // @ts-ignore
    const loader = normalizeLoader(testCase.input);
    expect(Array.isArray(loader.extensions), `${testCase.title}: extensions is array`).toBeTruthy();
    expect(
      loader.text || loader.binary,
      `${testCase.title}: text or binary flag is set`
    ).toBeTruthy();
    if (testCase.options) {
      expect(loader.options, `${testCase.title}: options populated`).toEqual(testCase.options);
    }
  }
  expect(
    () =>
      normalizeLoader({
        ...images.ImageLoader,
        // @ts-ignore
        extensions: 'jpg'
      }),
    'should throw on malformed extensions field'
  ).toThrow();
});
