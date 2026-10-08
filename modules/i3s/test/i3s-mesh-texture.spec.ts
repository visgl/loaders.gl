// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';
import {Ellipsoid} from '@math.gl/geospatial';
import {GZipDecompressor} from '@loaders.gl/compression/gzip-decompressor';
import {
  encodeI3SMeshLayer,
  encodeI3SMeshLayerWithDraco,
  type I3SMeshTexture
} from '@loaders.gl/i3s';
import {prepareI3SMeshTexture} from '../src/i3s-mesh-texture';
import {I3SSceneLayerSchema} from '@loaders.gl/i3s/i3s-zod-schema';
import type {MeshGeometry} from '@loaders.gl/schema';

let png: Uint8Array;
let jpeg: Uint8Array;
const OPTIONS = {maxPositionError: 0.001, maxResourceBytes: 8192};
const decompressor = new GZipDecompressor({useNative: false});
beforeAll(async () => {
  [png, jpeg] = await Promise.all(
    ['png', 'jpg'].map(
      async extension =>
        new Uint8Array(
          await (
            await fetchFile(
              new URL(`../../../test/data/tile-converter-texture.${extension}`, import.meta.url)
                .href
            )
          ).arrayBuffer()
        )
    )
  );
});
/** Three geographic positions with normalized UVs. */
function createMesh(normalized = true): MeshGeometry {
  return {
    topology: 'triangle-list',
    mode: 4,
    attributes: {
      POSITION: {
        value: new Float64Array(
          [
            [10, 45, 100],
            [10.00001, 45, 100],
            [10, 45.00001, 100]
          ].flatMap(position => Array.from(Ellipsoid.WGS84.cartographicToCartesian(position)))
        ),
        size: 3
      },
      NORMAL: {value: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0]), size: 3},
      TEXCOORD_0: {
        value: normalized
          ? new Uint16Array([0, 0, 65535, 0, 0, 65535])
          : new Float32Array([0, 0, 1, 0, 0, 1]),
        size: 2,
        ...(normalized ? {normalized: true} : {})
      }
    }
  };
}

test.each([
  ['image/png', false],
  ['image/jpeg', false],
  ['image/png', true]
] as const)('I3S preserves %s bytes, transformed UVs and object IDs with Draco=%s', async (mimeType, draco) => {
  const image = mimeType === 'image/png' ? png : jpeg;
  const padded = new Uint8Array(image.length + 4);
  padded.set(image, 2);
  const texture = {
    data: padded.subarray(2, image.length + 2),
    mimeType,
    sampler: {wrapS: 33071, wrapT: 33648},
    transform: {offset: [0.25, -0.5], rotation: Math.PI / 2, scale: [0.5, -1]}
  } as const;
  const mesh = createMesh();
  const options = {...OPTIONS, objectIdOffset: 42, material: {baseColorTexture: texture}};
  const output = draco
    ? await encodeI3SMeshLayerWithDraco(mesh, options, {useLocalLibraries: true})
    : encodeI3SMeshLayer(mesh, options);
  const raw = Object.fromEntries(
    Object.entries(output.files).map(([name, bytes]) => [
      name,
      name.endsWith('.gz') ? decompressor.decompressSync(bytes) : bytes
    ])
  );
  const layer = JSON.parse(new TextDecoder().decode(raw['3dSceneLayer.json.gz']));
  expect(I3SSceneLayerSchema.safeParse(layer).success).toBe(true);
  expect(layer.textureSetDefinitions).toEqual([
    {formats: [{name: '0', format: mimeType === 'image/png' ? 'png' : 'jpg'}]}
  ]);
  expect(layer.materialDefinitions[0].pbrMetallicRoughness.baseColorTexture).toEqual({
    textureSetDefinitionId: 0,
    wrapS: 'none',
    wrapT: 'mirror'
  });
  expect(
    new Uint8Array(raw[`nodes/1/textures/0.${mimeType === 'image/png' ? 'png' : 'jpg'}`])
  ).toEqual(image);
  expect(new DataView(raw['nodes/1/attributes/f_0/0.bin.gz']).getUint32(4, true)).toBe(42);
  const geometry = raw['nodes/1/geometries/0.bin.gz'];
  const coordinates = draco
    ? (
        await parse(geometry, DracoLoader, {
          core: {worker: false, useLocalLibraries: true},
          draco: {shape: 'mesh', attributeNameEntry: 'i3s-attribute-type'}
        })
      ).attributes.TEXCOORD_0.value
    : new Float32Array(geometry, 8 + 3 * 24, 6);
  const pairs = Array.from({length: coordinates.length / 2}, (_, index) =>
    [coordinates[index * 2], coordinates[index * 2 + 1]]
      .map(value => Math.round(value * 1e6) / 1e6)
      .join(',')
  ).sort();
  expect(pairs).toEqual(['0.25,-0.5', '0.25,0', '1.25,-0.5'].sort());
  expect(mesh.attributes.TEXCOORD_0.value).toEqual(new Uint16Array([0, 0, 65535, 0, 0, 65535]));
});

test('raw UVs are retained without an image, with default transform and normalized Uint8 support', () => {
  expect(prepareI3SMeshTexture(undefined, 3)).toBeUndefined();
  expect(prepareI3SMeshTexture(createMesh(false).attributes.TEXCOORD_0, 3)).toEqual(
    new Float32Array([0, 0, 1, 0, 0, 1])
  );
  expect(
    prepareI3SMeshTexture({value: new Uint8Array([0, 255]), size: 2, normalized: true}, 1, {
      data: jpeg,
      mimeType: 'image/jpeg',
      sampler: {wrapS: 10497}
    })
  ).toEqual(new Float32Array([0, 1]));
  expect(
    encodeI3SMeshLayer(createMesh(false), OPTIONS).files['nodes/1/geometries/0.bin.gz']
  ).toBeInstanceOf(ArrayBuffer);
});

test.each([
  [
    'missing UVs',
    (_mesh: MeshGeometry, texture: I3SMeshTexture) => prepareI3SMeshTexture(undefined, 3, texture)
  ],
  [
    'bad header',
    (mesh: MeshGeometry, texture: I3SMeshTexture) =>
      prepareI3SMeshTexture(mesh.attributes.TEXCOORD_0, 3, {...texture, data: new Uint8Array(1)})
  ],
  [
    'wrong MIME',
    (mesh: MeshGeometry, texture: I3SMeshTexture) =>
      prepareI3SMeshTexture(mesh.attributes.TEXCOORD_0, 3, {...texture, mimeType: 'image/jpeg'})
  ],
  [
    'filtering',
    (mesh: MeshGeometry, texture: I3SMeshTexture) =>
      prepareI3SMeshTexture(mesh.attributes.TEXCOORD_0, 3, {...texture, sampler: {magFilter: 9728}})
  ],
  [
    'wrapping',
    (mesh: MeshGeometry, texture: I3SMeshTexture) =>
      prepareI3SMeshTexture(mesh.attributes.TEXCOORD_0, 3, {
        ...texture,
        sampler: {wrapS: 999 as 10497}
      })
  ],
  [
    'UV count',
    (mesh: MeshGeometry, texture: I3SMeshTexture) =>
      prepareI3SMeshTexture(mesh.attributes.TEXCOORD_0, 2, texture)
  ],
  [
    'UV packing',
    (mesh: MeshGeometry, texture: I3SMeshTexture) =>
      prepareI3SMeshTexture({...mesh.attributes.TEXCOORD_0, byteStride: 8}, 3, texture)
  ],
  [
    'transform',
    (mesh: MeshGeometry, texture: I3SMeshTexture) =>
      prepareI3SMeshTexture(mesh.attributes.TEXCOORD_0, 3, {...texture, transform: {rotation: NaN}})
  ],
  [
    'UV overflow',
    (mesh: MeshGeometry, texture: I3SMeshTexture) =>
      prepareI3SMeshTexture(mesh.attributes.TEXCOORD_0, 3, {
        ...texture,
        transform: {scale: [Number.MAX_VALUE, 1]}
      })
  ]
])('I3S texture profile rejects %s', (_name, attempt) => {
  expect(() => attempt(createMesh(), {data: png, mimeType: 'image/png'})).toThrow();
});

test.each([-1, NaN, 2147483648])('I3S rejects invalid object ID offset %s', objectIdOffset => {
  expect(() => encodeI3SMeshLayer(createMesh(), {...OPTIONS, objectIdOffset})).toThrow(
    /object IDs/
  );
});
