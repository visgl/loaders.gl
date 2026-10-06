import {afterEach, expect, test, vi} from 'vitest';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {parse} from '@loaders.gl/core';
import {GLTFScenegraph, GLTFWriter, GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {DataViewReadableFile} from '@loaders.gl/zip';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import type {MeshSourceFeatureOptions} from '@loaders.gl/tile-converter/v5/adapters';
import {ConversionPanel} from '../examples/website/i3s-slpk/src/components/conversion-panel';
import {
  convertSelectedContents,
  inspectConversionInput
} from '../examples/website/i3s-slpk/src/convert-tileset';
import {createInput, setInputValue, readSettledControl} from './utils/tile-browser-conversion';

const FEATURE_MAPPING: MeshSourceFeatureOptions = {
  metadataClass: 'building',
  sourceFeatureIdProperty: 'source_id',
  featureIdField: 'source_id',
  integer64Encoding: 'decimal-string',
  schema: {
    fields: [
      {name: 'source_id', type: 'uint64', nullable: false},
      {name: 'label', type: 'utf8', nullable: false}
    ]
  }
};
const MATERIAL = {
  pbrMetallicRoughness: {
    baseColorFactor: [0.2, 0.4, 0.6, 0.8],
    metallicFactor: 0,
    roughnessFactor: 0.7
  },
  alphaMode: 'MASK' as const,
  alphaCutoff: 0.3,
  doubleSided: true
};

/** Generates two triangles with a material and optional metadata or normalized vertex colors. */
function createMesh(
  features: boolean,
  colors = false,
  mutate?: (scene: GLTFScenegraph) => void
): ArrayBuffer {
  const scene = new GLTFScenegraph({json: {asset: {version: '2.0'}}});
  const mesh = scene.addMesh({
    attributes: {
      POSITION: {
        value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 1, 0, 2, 0, 1, 2]),
        size: 3
      },
      ...(colors
        ? {
            COLOR_0: {
              value: new Uint8Array(Array(6).fill([255, 128, 0, 255]).flat()),
              size: 4,
              normalized: true
            }
          }
        : {}),
      ...(features ? {_FEATURE_ID_0: {value: new Uint16Array([1, 1, 1, 0, 0, 0]), size: 1}} : {})
    },
    indices: new Uint16Array([0, 1, 2, 3, 4, 5]),
    material: scene.addMaterial(structuredClone(MATERIAL))
  });
  scene.setDefaultScene(scene.addScene({nodeIndices: [scene.addNode({meshIndex: mesh})]}));
  if (features) {
    const values = scene.addBufferView(
      new BigUint64Array([9007199254740993n, 18446744073709551615n])
    );
    const text = new TextEncoder().encode('München 🏠second');
    const offsets = scene.addBufferView(
      new Uint32Array([0, new TextEncoder().encode('München 🏠').length, text.length])
    );
    const labels = scene.addBufferView(text);
    scene.json.extensions = {
      EXT_structural_metadata: {
        schema: {
          id: 'schema',
          classes: {
            building: {
              properties: {
                source_id: {type: 'SCALAR', componentType: 'UINT64'},
                label: {type: 'STRING'}
              }
            }
          }
        },
        propertyTables: [
          {
            class: 'building',
            count: 2,
            properties: {source_id: {values}, label: {values: labels, stringOffsets: offsets}}
          }
        ]
      }
    };
    scene.getMesh(mesh).primitives[0].extensions = {
      EXT_mesh_features: {
        featureIds: [{featureCount: 2, attribute: 0, propertyTable: 0}]
      }
    };
    scene.registerRequiredExtension('EXT_mesh_features');
    scene.registerRequiredExtension('EXT_structural_metadata');
  }
  mutate?.(scene);
  scene.createBinaryChunk();
  return GLTFWriter.encodeSync!(scene.gltf);
}

/** Replaces only the selected content in a tiny, hermetic explicit tileset fixture. */
async function inspectMesh(data: ArrayBuffer) {
  const {fetcher, controller} = createInput();
  const original = fetcher.getMockImplementation()!;
  fetcher.mockImplementation((input, options) =>
    String(input).includes('selected.glb')
      ? Promise.resolve(new Response(data))
      : original(input, options)
  );
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  return {fetcher, controller, inspection};
}

/** Reads strings independently from the published I3S little-endian attribute layout. */
function readStrings(buffer: ArrayBuffer): string[] {
  const view = new DataView(buffer);
  const count = view.getUint32(0, true);
  let offset = 8 + 4 * count;
  return Array.from({length: count}, (_, index) => {
    const size = view.getUint32(8 + 4 * index, true);
    const value = new TextDecoder().decode(new Uint8Array(buffer, offset, size - 1));
    offset += size;
    return value;
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('browser SLPK mapping preserves exact IDs, Unicode, material factors and triangle ownership', async () => {
  const {fetcher, controller, inspection} = await inspectMesh(createMesh(true));
  const mapping = structuredClone(FEATURE_MAPPING);
  const result = await convertSelectedContents(
    inspection,
    [inspection.resources[1].resourceId],
    'slpk',
    controller.signal,
    () => {},
    fetcher,
    mapping
  );
  expect(mapping).toEqual(FEATURE_MAPPING);
  const reader = await parseSLPKArchive(
    new DataViewReadableFile(new DataView(await result.file.arrayBuffer()))
  );
  try {
    const layer = JSON.parse(new TextDecoder().decode(await reader.getFile('', 'http')));
    expect(layer.materialDefinitions[0]).toMatchObject({
      ...MATERIAL,
      alphaMode: 'mask',
      pbrMetallicRoughness: {
        ...MATERIAL.pbrMetallicRoughness,
        baseColorFactor: [0.48452920448170694, 0.6651850846308363, 0.7977377330312598, 0.8]
      }
    });
    expect(layer.fields.map((field: {name: string}) => field.name)).toEqual([
      'OBJECTID',
      'source_id',
      'label'
    ]);
    expect(readStrings(await reader.getFile('nodes/1/attributes/f_1/0', 'http'))).toEqual([
      '9007199254740993',
      '18446744073709551615'
    ]);
    expect(readStrings(await reader.getFile('nodes/1/attributes/f_2/0', 'http'))).toEqual([
      'München 🏠',
      'second'
    ]);
    const geometry = new DataView(await reader.getFile('nodes/1/geometries/0', 'http'));
    expect(geometry.getUint32(4, true)).toBe(2);
    expect([geometry.getBigUint64(80, true), geometry.getBigUint64(88, true)]).toEqual([0n, 1n]);
    expect(Array.from({length: 4}, (_, index) => geometry.getUint32(96 + index * 4, true))).toEqual(
      [0, 0, 1, 1]
    );
    // Row 0 owns the original second triangle: source z=2 becomes ECEF y=-2 with Y-up.
    expect(geometry.getFloat32(8, true)).toBeLessThan(geometry.getFloat32(8 + 36, true));
    expect(result.report.diagnostics.some(d => d.code === 'I3S_INTEGER_DECIMAL_STRING')).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
  } finally {
    await reader.file.close();
  }
});

test('browser 3TZ preserves normalized colors and one selected material, while I3S rejects colors', async () => {
  const {fetcher, controller, inspection} = await inspectMesh(createMesh(false, true));
  const result = await convertSelectedContents(
    inspection,
    [inspection.resources[1].resourceId],
    '3tz',
    controller.signal,
    () => {},
    fetcher
  );
  const reader = new Tiles3DArchive(
    new DataViewReadableFile(new DataView(await result.file.arrayBuffer()))
  );
  try {
    const gltf = postProcessGLTF(
      await parse(await reader.getFile('mesh.glb'), GLTFLoader, {
        worker: false,
        gltf: {loadImages: false}
      })
    );
    const primitive = gltf.meshes![0].primitives[0];
    expect(primitive.material).toMatchObject(MATERIAL);
    expect(primitive.attributes.COLOR_0.normalized).toBe(true);
    expect(primitive.attributes.COLOR_0.value).toEqual(
      new Uint8Array(Array(6).fill([255, 128, 0, 255]).flat())
    );
  } finally {
    await reader.file.close();
  }
  await expect(
    convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId],
      'slpk',
      controller.signal,
      () => {},
      fetcher
    )
  ).rejects.toMatchObject({code: 'I3S_MESH_PROFILE_UNSUPPORTED'});
});

test('features require a complete schema and explicit target representation; 3TZ mappings reject before content I/O', async () => {
  const {fetcher, controller, inspection} = await inspectMesh(createMesh(true));
  const convert = (mapping?: MeshSourceFeatureOptions, format: 'slpk' | '3tz' = 'slpk') =>
    convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId],
      format,
      controller.signal,
      () => {},
      fetcher,
      mapping
    );
  await expect(convert(FEATURE_MAPPING, '3tz')).rejects.toThrow(/require SLPK/);
  expect(fetcher).toHaveBeenCalledOnce();
  await expect(convert()).rejects.toMatchObject({code: 'MESH_FEATURE_SCHEMA_REQUIRED'});
  await expect(convert({...FEATURE_MAPPING, metadataClass: 'wrong'})).rejects.toMatchObject({
    code: 'MESH_FEATURE_CLASS_MISMATCH'
  });
  await expect(
    convert({...FEATURE_MAPPING, schema: {fields: [FEATURE_MAPPING.schema.fields[0]]}})
  ).rejects.toMatchObject({code: 'FEATURE_PROPERTY_NOT_MAPPED'});
  await expect(convert({...FEATURE_MAPPING, integer64Encoding: undefined})).rejects.toMatchObject({
    code: 'I3S_MESH_PROFILE_UNSUPPORTED'
  });
  await expect(
    convert({
      ...FEATURE_MAPPING,
      schema: {
        fields: [FEATURE_MAPPING.schema.fields[0], {name: 'label', type: 'int32', nullable: false}]
      }
    })
  ).rejects.toMatchObject({code: 'FEATURE_VALUE_TYPE_MISMATCH'});
});

test('unsupported material semantics fail instead of changing appearance', async () => {
  const data = createMesh(false, false, scene => {
    scene.json.materials![0].emissiveFactor = [1, 0, 0];
  });
  const {fetcher, controller, inspection} = await inspectMesh(data);
  await expect(
    convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId],
      '3tz',
      controller.signal,
      () => {},
      fetcher
    )
  ).rejects.toMatchObject({code: 'MESH_SOURCE_MATERIAL_UNSUPPORTED'});
});

test('feature mapping controls reject malformed mappings, clear stale downloads and export mapped SLPK', async () => {
  const {fetcher} = await inspectMesh(createMesh(true));
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(React.createElement(ConversionPanel, {onPreview: () => {}})));
    await setInputValue(container.querySelector('input')!, 'https://example.invalid/tileset.json');
    await act(async () =>
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))
    );
    await expect
      .poll(() => readSettledControl(() => container.querySelector('#conversion-content')))
      .not.toBeNull();
    const selection = container.querySelector<HTMLSelectElement>('#conversion-content')!;
    selection.value = 'tile-0-content-1';
    await act(async () => selection.dispatchEvent(new Event('change', {bubbles: true})));
    const mapping = container.querySelector<HTMLTextAreaElement>('#conversion-features')!;
    const convert = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent === 'Convert selected content'
    )!;
    for (const value of ['{', 'null', '{"metadataClass":"building"}']) {
      await setInputValue(mapping, value);
      await act(async () => convert.click());
      await expect
        .poll(() => readSettledControl(() => container.querySelector('[role="alert"]')))
        .not.toBeNull();
      expect(container.querySelector('a')).toBeNull();
    }
    await setInputValue(mapping, JSON.stringify(FEATURE_MAPPING));
    await act(async () => convert.click());
    await expect
      .poll(() =>
        readSettledControl(
          () =>
            container.querySelector('a')?.download ||
            container.querySelector('[role="alert"]')?.textContent
        )
      )
      .toBe('selected-mesh.slpk');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    await setInputValue(mapping, '');
    expect(container.querySelector('a')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});

// UI lifecycle coverage uses an inline executor; real module workers are qualified separately.
vi.mock('../examples/website/i3s-slpk/src/conversion-worker-client', async () => {
  const {convertSelectedContents} = await import(
    '../examples/website/i3s-slpk/src/convert-tileset'
  );
  return {
    convertSelectedContentsInWorker: (
      ...arguments_: Parameters<
        typeof import('../examples/website/i3s-slpk/src/conversion-worker-client').convertSelectedContentsInWorker
      >
    ) => {
      const [inspection, resourceIds, format, signal, onProgress, features] = arguments_;
      return convertSelectedContents(
        inspection,
        resourceIds,
        format,
        signal,
        onProgress,
        fetch,
        features
      );
    }
  };
});
