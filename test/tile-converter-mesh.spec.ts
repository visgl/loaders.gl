// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {GLBLoader, GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';
import {GLTF2Schema} from '@loaders.gl/gltf/schema';
import type {MeshAttribute, MeshGeometry} from '@loaders.gl/schema';
import {
  encodeMeshTile,
  TileConversionError,
  type MeshTileMaterial
} from '@loaders.gl/tile-converter/v5';
import {encodeMeshTile as encodeBrowserMeshTile} from '@loaders.gl/tile-converter/v5/browser';

/** Creates the smallest unindexed triangle in a local coordinate frame. */
function createMesh(): MeshGeometry {
  return {
    topology: 'triangle-list',
    mode: 4,
    attributes: {POSITION: {value: new Float32Array([10, 20, 30, 11, 20, 30, 10, 21, 30]), size: 3}}
  };
}

test.each([
  undefined,
  Uint8Array,
  Uint16Array,
  Uint32Array
])('mesh encoder emits valid GLB and preserves geometry with indices %s', async IndexArray => {
  const mesh = createMesh();
  if (IndexArray) mesh.indices = {value: new IndexArray([0, 1, 2]), size: 1};
  const output = encodeMeshTile(mesh);
  const container = await parse(output, GLBLoader, {glb: {strict: true}});
  const validation = GLTF2Schema.safeParse(container.json);
  expect(validation.success, validation.error?.message).toBe(true);
  expect(container.version).toBe(2);
  expect(container.json.scene).toBe(0);
  expect(container.json.scenes).toEqual([{nodes: [0]}]);
  expect(container.json.nodes).toEqual([{mesh: 0}]);
  expect(container.json.buffers).toEqual([{byteLength: container.binChunks[0].byteLength}]);
  expect(container.json.accessors[0]).toMatchObject({
    type: 'VEC3',
    componentType: 5126,
    count: 3,
    min: [10, 20, 30],
    max: [11, 21, 30]
  });
  const scenegraph = new GLTFScenegraph(
    await parse(output, GLTFLoader, {gltf: {postProcess: false}})
  );
  expect(Array.from(scenegraph.getTypedArrayForAccessor(0))).toEqual(
    Array.from(mesh.attributes.POSITION.value)
  );
  const primitive = container.json.meshes[0].primitives[0];
  expect(primitive.mode).toBe(4);
  expect(primitive.material).toBeUndefined();
  if (IndexArray) {
    expect(Array.from(scenegraph.getTypedArrayForAccessor(primitive.indices))).toEqual([0, 1, 2]);
    expect(scenegraph.getTypedArrayForAccessor(primitive.indices)).toBeInstanceOf(IndexArray);
  } else {
    expect(primitive.indices).toBeUndefined();
  }
});

test('mesh encoder preserves normals and typed array subviews without changing input storage', async () => {
  const positionStorage = new Float32Array([999, ...createMesh().attributes.POSITION.value, 999]);
  const normalStorage = new Float32Array([999, 0, 0, 1, 0, 0, 1, 0, 0, 1, 999]);
  const indexStorage = new Uint16Array([999, 0, 1, 2, 999]);
  const before = [positionStorage.slice(), normalStorage.slice(), indexStorage.slice()];
  const mesh = createMesh();
  mesh.attributes.POSITION = {
    value: positionStorage.subarray(1, 10),
    size: 3,
    byteOffset: 0,
    byteStride: 0,
    normalized: false
  };
  mesh.attributes.NORMAL = {value: normalStorage.subarray(1, 10), size: 3};
  mesh.indices = {value: indexStorage.subarray(1, 4), size: 1};
  const output = encodeMeshTile(mesh);
  const scenegraph = new GLTFScenegraph(
    await parse(output, GLTFLoader, {gltf: {postProcess: false}})
  );
  expect(Array.from(scenegraph.getTypedArrayForAccessor(0))).toEqual(
    Array.from(positionStorage.subarray(1, 10))
  );
  expect(Array.from(scenegraph.getTypedArrayForAccessor(1))).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  expect(Array.from(scenegraph.getTypedArrayForAccessor(2))).toEqual([0, 1, 2]);
  expect([positionStorage, normalStorage, indexStorage]).toEqual(before);
});

test('mesh encoder is shared by the browser entrypoint', () => {
  expect(encodeBrowserMeshTile).toBe(encodeMeshTile);
});

test.each([
  [
    'topology',
    (mesh: MeshGeometry) => {
      mesh.topology = 'triangle-strip';
    },
    'MESH_TOPOLOGY_UNSUPPORTED'
  ],
  [
    'mode',
    (mesh: MeshGeometry) => {
      mesh.mode = 5;
    },
    'MESH_TOPOLOGY_UNSUPPORTED'
  ],
  [
    'unknown attribute',
    (mesh: MeshGeometry) => {
      mesh.attributes.TEXCOORD_1 = {value: new Float32Array(6), size: 2};
    },
    'MESH_ATTRIBUTE_UNSUPPORTED'
  ],
  [
    'missing positions',
    (mesh: MeshGeometry) => {
      delete mesh.attributes.POSITION;
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'position type',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value = new Float64Array(9);
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'position size',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.size = 2;
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'empty positions',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value = new Float32Array();
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'partial xyz',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value = new Float32Array(8);
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'nonfinite positions',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value[0] = NaN;
    },
    'MESH_ATTRIBUTE_NONFINITE'
  ],
  [
    'partial triangle',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value = new Float32Array(6);
    },
    'MESH_TRIANGLE_COUNT_INVALID'
  ],
  [
    'normal count',
    (mesh: MeshGeometry) => {
      mesh.attributes.NORMAL = {value: new Float32Array([0, 0, 1]), size: 3};
    },
    'MESH_NORMAL_COUNT_MISMATCH'
  ],
  [
    'normal length',
    (mesh: MeshGeometry) => {
      mesh.attributes.NORMAL = {value: new Float32Array(9), size: 3};
    },
    'MESH_NORMAL_INVALID'
  ],
  [
    'index type',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Int16Array([0, 1, 2]), size: 1};
    },
    'MESH_INDICES_INVALID'
  ],
  [
    'index size',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Uint8Array([0, 1, 2]), size: 3};
    },
    'MESH_INDICES_INVALID'
  ],
  [
    'empty indices',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Uint8Array(), size: 1};
    },
    'MESH_TRIANGLE_COUNT_INVALID'
  ],
  [
    'partial indices',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Uint8Array([0, 1]), size: 1};
    },
    'MESH_TRIANGLE_COUNT_INVALID'
  ],
  [
    'index range',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Uint8Array([0, 1, 3]), size: 1};
    },
    'MESH_INDEX_OUT_OF_RANGE'
  ]
])('mesh encoder rejects %s with a typed diagnostic', (_name, change, code) => {
  const mesh = createMesh();
  change(mesh);
  expect(() => encodeMeshTile(mesh)).toThrow(TileConversionError);
  expect(() => encodeMeshTile(mesh)).toThrow(expect.objectContaining({code}));
});

test.each([
  {byteOffset: 4},
  {byteStride: 12},
  {normalized: true},
  {componentType: 'float16' as const},
  {transform: {type: 'quantization' as const, bits: 16, origin: [0, 0, 0], range: 1}}
])('mesh encoder rejects unsupported descriptor %j for vertices and indices', layout => {
  for (const name of ['POSITION', 'NORMAL', 'indices']) {
    const mesh = createMesh();
    const attribute: MeshAttribute =
      name === 'indices'
        ? {value: new Uint8Array([0, 1, 2]), size: 1, ...layout}
        : {value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), size: 3, ...layout};
    if (name === 'indices') mesh.indices = attribute;
    else mesh.attributes[name] = attribute;
    expect(() => encodeMeshTile(mesh)).toThrow(
      expect.objectContaining({code: 'MESH_ATTRIBUTE_LAYOUT_UNSUPPORTED'})
    );
  }
});

test('mesh encoder rejects primitive restart even when it is below vertex count', () => {
  const mesh = createMesh();
  mesh.attributes.POSITION.value = new Float32Array(256 * 3);
  mesh.indices = {value: new Uint8Array([0, 1, 255]), size: 1};
  expect(() => encodeMeshTile(mesh)).toThrow(
    expect.objectContaining({code: 'MESH_INDEX_OUT_OF_RANGE'})
  );
});

test.each([
  3, 4
])('mesh encoder preserves linear colors of size %s and input subviews', async size => {
  const mesh = createMesh();
  const values =
    size === 3
      ? [1, 0, 0.5, 0, 1, 0.5, 0, 0.5, 1]
      : [1, 0, 0.5, 0.25, 0, 1, 0.5, 0.5, 0, 0.5, 1, 1];
  const storage = new Float32Array([999, ...values, 999]);
  const before = storage.slice();
  mesh.attributes.COLOR_0 = {value: storage.subarray(1, storage.length - 1), size};
  const output = encodeMeshTile(mesh);
  const scenegraph = new GLTFScenegraph(
    await parse(output, GLTFLoader, {gltf: {postProcess: false}})
  );
  const primitive = scenegraph.json.meshes![0].primitives[0];
  const accessor = primitive.attributes.COLOR_0;
  expect(scenegraph.json.accessors![accessor]).toMatchObject({
    type: `VEC${size}`,
    componentType: 5126,
    count: 3
  });
  expect(Array.from(scenegraph.getTypedArrayForAccessor(accessor))).toEqual(values);
  expect(GLTF2Schema.safeParse(scenegraph.json).success).toBe(true);
  expect(storage).toEqual(before);
  expect(primitive.material).toBeUndefined();
});

test.each([
  {label: 'wrong type', attribute: {value: new Uint8Array(9), size: 3}},
  {label: 'wrong size', attribute: {value: new Float32Array(6), size: 2}},
  {label: 'wrong count', attribute: {value: new Float32Array(6), size: 3}},
  {label: 'negative', attribute: {value: new Float32Array([-0.01, ...Array(8).fill(0)]), size: 3}},
  {label: 'above one', attribute: {value: new Float32Array([1.01, ...Array(8).fill(0)]), size: 3}},
  {label: 'nonfinite', attribute: {value: new Float32Array([NaN, ...Array(8).fill(0)]), size: 3}},
  {label: 'normalized', attribute: {value: new Float32Array(9), size: 3, normalized: true}}
])('mesh encoder rejects invalid colors: $label', ({attribute, label}) => {
  const mesh = createMesh();
  mesh.attributes.COLOR_0 = attribute;
  expect(() => encodeMeshTile(mesh)).toThrowError(
    expect.objectContaining({
      code: label === 'normalized' ? 'MESH_ATTRIBUTE_LAYOUT_UNSUPPORTED' : 'MESH_COLOR_INVALID'
    })
  );
});

test.each([
  {label: 'null', descriptor: null},
  {label: 'undefined', descriptor: undefined},
  {label: 'false', descriptor: false},
  {label: 'zero', descriptor: 0},
  {label: 'empty string', descriptor: ''}
])('mesh encoder rejects explicitly selected falsy color descriptors: $label', ({descriptor}) => {
  const mesh = createMesh();
  mesh.attributes.COLOR_0 = descriptor as unknown as MeshAttribute;
  expect(() => encodeMeshTile(mesh)).toThrowError(
    expect.objectContaining({code: 'MESH_COLOR_INVALID'})
  );
});

test.each([
  'OPAQUE',
  'MASK',
  'BLEND'
] as const)('mesh encoder preserves an explicit %s material', async alphaMode => {
  const material: MeshTileMaterial = {
    baseColorFactor: [0.25, 0.5, 1, 0.75],
    metallicFactor: 0,
    roughnessFactor: 1,
    alphaMode,
    doubleSided: true,
    ...(alphaMode === 'MASK' ? {alphaCutoff: 0.25} : {})
  };
  const before = structuredClone(material);
  const container = await parse(encodeMeshTile(createMesh(), {material}), GLBLoader, {
    glb: {strict: true}
  });
  expect(container.json.meshes[0].primitives[0].material).toBe(0);
  expect(container.json.materials).toEqual([
    {
      pbrMetallicRoughness: {
        baseColorFactor: [0.25, 0.5, 1, 0.75],
        metallicFactor: 0,
        roughnessFactor: 1
      },
      alphaMode,
      doubleSided: true,
      ...(alphaMode === 'MASK' ? {alphaCutoff: 0.25} : {})
    }
  ]);
  expect(GLTF2Schema.safeParse(container.json).success).toBe(true);
  expect(material).toEqual(before);
});

test('mesh encoder retains glTF defaults when material properties are omitted', async () => {
  const container = await parse(encodeMeshTile(createMesh(), {material: {}}), GLBLoader);
  expect(container.json.materials).toEqual([{pbrMetallicRoughness: {}}]);
  const boundary = await parse(
    encodeMeshTile(createMesh(), {
      material: {
        baseColorFactor: [0, 1, 0, 1],
        metallicFactor: 1,
        roughnessFactor: 0,
        alphaMode: 'MASK',
        alphaCutoff: 2,
        doubleSided: false
      }
    }),
    GLBLoader
  );
  expect(boundary.json.materials[0]).toMatchObject({alphaCutoff: 2, doubleSided: false});
  expect(GLTF2Schema.safeParse(boundary.json).success).toBe(true);
});

test.each([
  {label: 'null', material: null},
  {label: 'primitive', material: 1},
  {label: 'array', material: []},
  {label: 'color type', material: {baseColorFactor: 1}},
  {label: 'color length', material: {baseColorFactor: [1, 1, 1]}},
  {label: 'sparse color', material: {baseColorFactor: Array(4)}},
  {label: 'negative color', material: {baseColorFactor: [-1, 1, 1, 1]}},
  {label: 'high color', material: {baseColorFactor: [2, 1, 1, 1]}},
  {label: 'nonfinite color', material: {baseColorFactor: [NaN, 1, 1, 1]}},
  {label: 'nonfinite factor', material: {metallicFactor: Infinity}},
  {label: 'negative factor', material: {roughnessFactor: -1}},
  {label: 'high factor', material: {metallicFactor: 2}},
  {label: 'alpha mode', material: {alphaMode: 'TRANSPARENT'}},
  {label: 'ignored cutoff', material: {alphaCutoff: 0.5}},
  {label: 'negative cutoff', material: {alphaMode: 'MASK', alphaCutoff: -1}},
  {label: 'nonfinite cutoff', material: {alphaMode: 'MASK', alphaCutoff: Infinity}},
  {label: 'double sided type', material: {doubleSided: 1}}
])('mesh encoder rejects invalid material: $label', ({material}) => {
  expect(() => encodeMeshTile(createMesh(), {material: material as MeshTileMaterial})).toThrowError(
    expect.objectContaining({code: 'MESH_MATERIAL_INVALID'})
  );
});

test.each([
  'normalTexture',
  'emissiveFactor',
  'extensions'
])('mesh encoder rejects unsupported material property %s', property => {
  expect(() => encodeMeshTile(createMesh(), {material: {[property]: {}}})).toThrowError(
    expect.objectContaining({code: 'MESH_MATERIAL_UNSUPPORTED'})
  );
});

/** Tiny valid encoded images reused by header-boundary and GLB embedding cases. */
let pngImage: Uint8Array;
let jpegImage: Uint8Array;
beforeAll(async () => {
  [pngImage, jpegImage] = await Promise.all(
    ['png', 'jpg'].map(
      async extension =>
        new Uint8Array(
          await (
            await fetchFile(
              new URL(`./data/tile-converter-texture.${extension}`, import.meta.url).href
            )
          ).arrayBuffer()
        )
    )
  );
});

/** Selects UVs that also exercise the default repeating sampler outside [0, 1]. */
function createTexturedMesh(): MeshGeometry {
  const mesh = createMesh();
  mesh.attributes.TEXCOORD_0 = {value: new Float32Array([-1, 0, 1, 0, 0, 2]), size: 2};
  return mesh;
}

test.each([
  'image/png',
  'image/jpeg'
] as const)('mesh encoder embeds %s bytes and UV subviews without changing inputs', async mimeType => {
  const image = mimeType === 'image/png' ? pngImage : jpegImage;
  const imageStorage = new Uint8Array(image.length + 2);
  imageStorage.set(image, 1);
  const texture = {data: imageStorage.subarray(1, -1), mimeType};
  const mesh = createTexturedMesh();
  const coordinateStorage = new Float32Array([999, -1, 0, 1, 0, 0, 2, 999]);
  mesh.attributes.TEXCOORD_0.value = coordinateStorage.subarray(1, -1);
  const before = structuredClone({mesh, texture});
  const output = encodeMeshTile(mesh, {material: {baseColorTexture: texture}});
  const container = await parse(output, GLBLoader, {glb: {strict: true}});
  expect(GLTF2Schema.safeParse(container.json).success).toBe(true);
  const primitive = container.json.meshes[0].primitives[0];
  expect(container.json.accessors[primitive.attributes.TEXCOORD_0]).toMatchObject({
    type: 'VEC2',
    componentType: 5126,
    count: 3
  });
  expect(container.json.materials[primitive.material]).toEqual({
    pbrMetallicRoughness: {baseColorTexture: {index: 0}}
  });
  expect(container.json.textures).toEqual([{source: 0}]);
  expect(container.json.samplers).toBeUndefined();
  expect(container.json.images[0]).toEqual({bufferView: 0, mimeType});
  const imageView = container.json.bufferViews[0];
  expect(
    new Uint8Array(
      container.binChunks[0].arrayBuffer,
      container.binChunks[0].byteOffset + imageView.byteOffset,
      imageView.byteLength
    )
  ).toEqual(image);
  const scenegraph = new GLTFScenegraph(
    await parse(output, GLTFLoader, {gltf: {postProcess: false, loadImages: false}})
  );
  expect(Array.from(scenegraph.getTypedArrayForAccessor(primitive.attributes.TEXCOORD_0))).toEqual([
    -1, 0, 1, 0, 0, 2
  ]);
  expect({mesh, texture}).toEqual(before);
  expect(coordinateStorage[0]).toBe(999);
  expect(imageStorage[0]).toBe(0);
});

test('mesh encoder preserves UVs without requiring a material', async () => {
  const container = await parse(encodeMeshTile(createTexturedMesh()), GLBLoader);
  expect(container.json.meshes[0].primitives[0].attributes.TEXCOORD_0).toBeDefined();
  expect(container.json.materials).toBeUndefined();
});

test.each([
  {label: 'null', attribute: null},
  {label: 'undefined', attribute: undefined},
  {label: 'false', attribute: false},
  {label: 'integer type', attribute: {value: new Uint16Array(6), size: 2}},
  {label: 'size', attribute: {value: new Float32Array(6), size: 3}},
  {label: 'count', attribute: {value: new Float32Array(4), size: 2}},
  {label: 'nonfinite', attribute: {value: new Float32Array([NaN, 0, 0, 0, 0, 0]), size: 2}}
])('mesh encoder rejects invalid selected UVs: $label', ({attribute}) => {
  const mesh = createMesh();
  mesh.attributes.TEXCOORD_0 = attribute as MeshAttribute;
  expect(() => encodeMeshTile(mesh)).toThrowError(
    expect.objectContaining({code: 'MESH_TEXCOORD_INVALID'})
  );
});

test('mesh encoder rejects UV layouts it cannot preserve', () => {
  const mesh = createTexturedMesh();
  mesh.attributes.TEXCOORD_0.normalized = true;
  expect(() => encodeMeshTile(mesh)).toThrowError(
    expect.objectContaining({code: 'MESH_ATTRIBUTE_LAYOUT_UNSUPPORTED'})
  );
});

test('mesh encoder requires UVs for a selected base-color image', () => {
  expect(() =>
    encodeMeshTile(createMesh(), {
      material: {baseColorTexture: {data: pngImage, mimeType: 'image/png'}}
    })
  ).toThrowError(expect.objectContaining({code: 'MESH_TEXCOORD_REQUIRED'}));
});

test.each([
  {label: 'null', texture: () => null},
  {label: 'undefined', texture: () => undefined},
  {label: 'false', texture: () => false},
  {label: 'external URL', texture: () => ({uri: 'https://example.invalid/image.png'})},
  {label: 'ArrayBuffer', texture: () => ({data: pngImage.buffer, mimeType: 'image/png'})},
  {label: 'unsupported format', texture: () => ({data: pngImage, mimeType: 'image/webp'})},
  {label: 'sampler', texture: () => ({data: pngImage, mimeType: 'image/png', sampler: {}})},
  {label: 'UV set', texture: () => ({data: pngImage, mimeType: 'image/png', texCoord: 1})},
  {label: 'transform', texture: () => ({data: pngImage, mimeType: 'image/png', extensions: {}})},
  {label: 'MIME mismatch', texture: () => ({data: pngImage, mimeType: 'image/jpeg'})},
  {label: 'empty image', texture: () => ({data: new Uint8Array(), mimeType: 'image/png'})},
  {
    label: 'truncated header',
    texture: () => ({data: pngImage.subarray(0, 24), mimeType: 'image/png'})
  },
  {
    label: 'incomplete PNG signature',
    texture: () => {
      const data = pngImage.slice();
      data[4] = 255;
      return {data, mimeType: 'image/png'};
    }
  },
  {
    label: 'zero width',
    texture: () => {
      const data = pngImage.slice();
      data.fill(0, 16, 20);
      return {data, mimeType: 'image/png'};
    }
  },
  {
    label: 'zero height',
    texture: () => {
      const data = pngImage.slice();
      data.fill(0, 20, 24);
      return {data, mimeType: 'image/png'};
    }
  },
  {
    label: 'malformed other format',
    texture: () => ({
      data: new Uint8Array([66, 77, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      mimeType: 'image/png'
    })
  }
])('mesh encoder rejects invalid selected texture: $label', ({texture}) => {
  const material = {baseColorTexture: texture()} as unknown as MeshTileMaterial;
  expect(() => encodeMeshTile(createTexturedMesh(), {material})).toThrowError(
    expect.objectContaining({code: 'MESH_TEXTURE_INVALID'})
  );
});
