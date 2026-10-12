// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {
  createBrowserTilesetConversionSource,
  createTiles3DConversionSpatialContext
} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTilesetConversionInspection,
  TileConversionReport
} from '@loaders.gl/tile-converter/v5/core';
import {
  createMeshHierarchyTilesetSink,
  createSelectedMeshConversionSource,
  createMeshConversionCodec,
  encodeMeshTile
} from '@loaders.gl/tile-converter/v5/adapters';
import type {EncodedMeshConversionResource} from '@loaders.gl/tile-converter/v5/adapters';
import {convertTileset} from '@loaders.gl/tile-converter/v5/core';
import {createTriangle} from './utils/tile-browser-conversion';

/** Small explicit mixed-refinement tree with scaled ECEF placement. */
function createDocument() {
  return {
    asset: {version: '1.1', gltfUpAxis: 'Z'},
    extensions: {
      EXT_geospatial_crs: {
        format: 'wkid',
        extensions: {EXT_geospatial_crs_wkid: {authority: 'EPSG', wkid: 4978}}
      }
    },
    geometricError: 30,
    root: {
      geometricError: 10,
      refine: 'REPLACE',
      boundingVolume: {sphere: [0, 0, 0, 100]},
      transform: Array.from(new Matrix4().translate([6378137, 0, 0]).scale([2, 3, 4])),
      content: {uri: 'parent.glb'},
      children: [
        {
          geometricError: 2,
          boundingVolume: {sphere: [0, 0, 0, 10]},
          content: {uri: 'child.glb'},
          transform: Array.from(new Matrix4().translate([10, 20, 30]))
        },
        {
          geometricError: 3,
          refine: 'ADD',
          boundingVolume: {sphere: [0, 0, 0, 10]},
          children: [
            {geometricError: 0, boundingVolume: {sphere: [0, 0, 0, 1]}, content: {uri: 'leaf.glb'}}
          ]
        }
      ]
    }
  };
}

/** Qualifies immutable JSON using the real metadata source without fetching payloads. */
async function inspect(document = createDocument()) {
  const source = createBrowserTilesetConversionSource({
    input: 'https://example.invalid/tileset.json',
    maxInputBytes: 4096,
    maxInputResources: 64,
    inspectNestedTilesets: true,
    fetcher: async () => new Response(JSON.stringify(document))
  });
  return source.inspect();
}

/** Direct trusted codec output to isolate hierarchy sink behavior from mesh decoding. */
function createResource(
  contentResourceId: string,
  origin: [number, number, number]
): EncodedMeshConversionResource {
  return {
    id: `${contentResourceId}/primitive`,
    contentResourceId,
    origin,
    glb: encodeMeshTile({
      topology: 'triangle-list',
      mode: 4,
      attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}}
    }),
    localBoundingBox: [
      [0, 0, 0],
      [1, 1, 0]
    ],
    boundingBox: [origin, origin.map(value => value + 1)],
    maximumPositionError: 0,
    spatialReference: createTiles3DConversionSpatialContext({
      sourceCrs: 'EPSG:4978',
      heightReference: 'ellipsoidal',
      coordinateFrame: 'geocentric',
      axisOrder: 'xyz'
    }).spatialReference
  };
}

/** Completed orchestration report used for sink lifecycle assertions. */
const REPORT: TileConversionReport = {
  state: 'completed',
  inputResources: 3,
  outputResources: 3,
  inputBytes: 0,
  outputBytes: 0,
  largestOutputResourceBytes: 0,
  diagnostics: []
};

/** Retained output policy with all source content explicitly selected. */
function createOptions(inspection: BrowserTilesetConversionInspection) {
  return {
    inspection,
    resourceIds: inspection.resources.map(resource => resource.resourceId),
    maxTotalBytes: 16384,
    maxPositionError: 0.01
  };
}

/** Reads the authored JSON only after successful sink finalization. */
async function readDocument(sink: ReturnType<typeof createMeshHierarchyTilesetSink>) {
  return JSON.parse(
    await sink
      .getFiles()
      .find(file => file.resourceId === 'tileset.json')!
      .blob.text()
  );
}

test('hierarchy retains parent content, inherited refinement, empty ancestors and relative placements', async () => {
  const inspection = await inspect();
  const options = createOptions(inspection);
  const sink = createMeshHierarchyTilesetSink(options);
  const origins: [number, number, number][] = [
    [6378137, 0, 0],
    [6378157, 60, 120],
    [6378137, 1, 0]
  ];
  // Arrival order does not alter original topology or stable names.
  for (const index of [2, 0, 1])
    await sink.write(createResource(options.resourceIds[index], origins[index]));
  expect(sink.getFiles()).toEqual([]);
  await sink.finalize!(REPORT);
  const document = await readDocument(sink);
  expect(document.geometricError).toBeCloseTo(40.01);
  expect(document.root.geometricError).toBeCloseTo(40.01);
  expect(document.root.refine).toBe('REPLACE');
  expect(document.root.content.uri).toBe('meshes/0.glb');
  expect(document.root.children[0].geometricError).toBeCloseTo(8.01);
  expect(document.root.children[0].refine).toBe('REPLACE');
  expect(document.root.children[1].refine).toBe('ADD');
  expect(document.root.children[1].content).toBeUndefined();
  expect(document.root.children[1].children[0].refine).toBe('ADD');
  expect(document.root.children[1].children[0].geometricError).toBeCloseTo(0.01);
  const parent = new Matrix4(document.root.transform);
  const child = new Matrix4(parent).multiplyRight(document.root.children[0].transform);
  expect(child.transformAsPoint([0, 0, 0])).toEqual(origins[1]);
  const empty = new Matrix4(parent).multiplyRight(document.root.children[1].transform);
  expect(empty.transformAsPoint([0, 0, 0])).toEqual([0, 0, 0]);
  const leaf = new Matrix4(empty).multiplyRight(document.root.children[1].children[0].transform);
  expect(leaf.transformAsPoint([0, 0, 0])).toEqual(origins[2]);
  const box = document.root.boundingVolume.box;
  const center = parent.transformAsPoint(box.slice(0, 3));
  [6378147.5, 30.5, 60].forEach((value, axis) => expect(center[axis]).toBeCloseTo(value, 7));
});

test.each([
  'omitted',
  'duplicate',
  'unknown',
  'unlinkedDocument',
  'metadata',
  'requestVolume',
  'implicit',
  'multiple',
  'refine',
  'error',
  'matrix',
  'emptyLeaf',
  'count'
] as const)('hierarchy rejects %s before decoding', async mode => {
  const inspection = await inspect();
  const options = createOptions(inspection);
  const root = inspection.tileset.root!;
  if (mode === 'omitted') options.resourceIds.pop();
  if (mode === 'duplicate') options.resourceIds[1] = options.resourceIds[0];
  if (mode === 'unknown') options.resourceIds[1] = 'unknown';
  if (mode === 'unlinkedDocument')
    Object.assign(inspection, {
      documents: [...inspection.documents!, {...inspection.documents![0]}]
    });
  if (mode === 'metadata') Object.assign(root, {metadata: {}});
  if (mode === 'requestVolume') Object.assign(root, {viewerRequestVolume: {}});
  if (mode === 'implicit') root.implicitTiling = {};
  if (mode === 'multiple') root.contents = [root.content];
  if (mode === 'refine') Object.assign(root, {refine: 'UNKNOWN'});
  if (mode === 'error') root.geometricError = -1;
  if (mode === 'matrix') root.transform![15] = 0;
  if (mode === 'emptyLeaf') root.children!.push({geometricError: 0});
  if (mode === 'count')
    root.children.push(...Array.from({length: 256}, () => ({geometricError: 0})));
  expect(() => createMeshHierarchyTilesetSink(options)).toThrow();
});

test('hierarchy requires all completed placements and rejects duplicates, unknown IDs and writes after close', async () => {
  const options = createOptions(await inspect());
  const sink = createMeshHierarchyTilesetSink(options);
  const resource = createResource(options.resourceIds[0], [6378137, 0, 0]);
  await expect(sink.finalize!(REPORT)).rejects.toThrow('every declared');
  await sink.write(resource);
  await expect(sink.write(resource)).rejects.toThrow('one output');
  await expect(sink.write({...resource, contentResourceId: 'unknown'})).rejects.toThrow(
    'one output'
  );
  await sink.abort!(new Error('cancel'));
  expect(sink.getFiles()).toEqual([]);
  await expect(sink.write(resource)).rejects.toThrow('one output');
});

test.each([
  -1,
  NaN,
  Infinity
])('hierarchy rejects invalid position allowance %s', async maxPositionError => {
  const options = createOptions(await inspect());
  expect(() => createMeshHierarchyTilesetSink({...options, maxPositionError})).toThrow();
});

test('hierarchy bounds snapshot codec metadata and honor cancellation and retained-byte limits', async () => {
  const options = createOptions(await inspect());
  const sink = createMeshHierarchyTilesetSink({...options, maxTotalBytes: 1});
  await expect(
    sink.write(createResource(options.resourceIds[0], [6378137, 0, 0]))
  ).rejects.toThrow();
  await sink.abort!(new Error('budget'));
  expect(sink.getFiles()).toEqual([]);
  const controller = new AbortController();
  controller.abort();
  await expect(
    createMeshHierarchyTilesetSink(options).write(
      createResource(options.resourceIds[0], [6378137, 0, 0]),
      controller.signal
    )
  ).rejects.toThrow();
});

test.each([
  false,
  true
])('shared extraction qualifies a complete parent/child tree; multiple primitives=%s', async twoPrimitives => {
  const document = createDocument();
  const fetcher: typeof fetch = async input =>
    new Response(
      String(input).endsWith('tileset.json')
        ? JSON.stringify(document)
        : createTriangle(twoPrimitives)
    );
  const rawSource = createBrowserTilesetConversionSource({
    input: 'https://example.invalid/tileset.json',
    maxInputBytes: 8192,
    maxInputResources: 64,
    inspectNestedTilesets: true,
    fetcher
  });
  const inspection = await rawSource.inspect();
  const options = createOptions(inspection);
  const selection = await createSelectedMeshConversionSource(inspection, {
    resourceIds: options.resourceIds,
    preserveHierarchy: true,
    source: rawSource,
    fetcher,
    signal: new AbortController().signal,
    dracoLibraryOptions: {}
  });
  const sink = createMeshHierarchyTilesetSink(options);
  const conversion = convertTileset({
    source: selection.source,
    sink,
    codec: createMeshConversionCodec({
      spatialContext: selection.spatialContext,
      maxPositionError: 0.01,
      draco: false
    }),
    measureInputBytes: resource => resource.mesh.attributes.POSITION.value.byteLength,
    measureOutputBytes: resource => resource.glb.byteLength
  });
  if (twoPrimitives) {
    await expect(conversion).rejects.toThrow('one mesh primitive');
    expect(sink.getFiles()).toEqual([]);
  } else {
    expect((await conversion).outputResources).toBe(3);
    expect((await readDocument(sink)).root.children).toHaveLength(2);
  }
});

test('3D Tiles 1.0 retains metric errors without the 1.1 transform scaling rule', async () => {
  const document = createDocument();
  document.asset.version = '1.0';
  const options = createOptions(await inspect(document));
  const sink = createMeshHierarchyTilesetSink(options);
  for (const identifier of options.resourceIds)
    await sink.write(createResource(identifier, [6378137, 0, 0]));
  await sink.finalize!(REPORT);
  const result = await readDocument(sink);
  expect(result.root.geometricError).toBeCloseTo(10.01);
  expect(result.root.children[0].geometricError).toBeCloseTo(2.01);
  expect(result.geometricError).toBeCloseTo(30.01);
});

test('hierarchy snapshots placement metadata and retains explicit native CRS/epoch declarations', async () => {
  const inspection = await inspect();
  const extensions = {
    EXT_geospatial_crs: {
      format: 'wkid',
      extensions: {EXT_geospatial_crs_wkid: {authority: 'EPSG', wkid: 4978, epoch: 2020}}
    }
  };
  Object.assign(inspection.tileset, {extensions, extensionsRequired: ['EXT_geospatial_crs']});
  const options = createOptions(inspection);
  const sink = createMeshHierarchyTilesetSink(options);
  extensions.EXT_geospatial_crs.extensions.EXT_geospatial_crs_wkid.epoch = 2021;
  for (const identifier of options.resourceIds) {
    const original = createResource(identifier, [6378137, 0, 0]);
    const resource = {
      ...original,
      spatialReference: {
        ...original.spatialReference,
        coordinateEpoch: 2020
      }
    };
    await sink.write(resource);
    (resource.origin as number[])[0] = 0;
    (resource.localBoundingBox[1] as number[])[0] = 100;
  }
  await sink.finalize!(REPORT);
  const result = await readDocument(sink);
  expect(result.root.transform.slice(12, 15)).toEqual([6378137, 0, 0]);
  expect(result.root.boundingVolume.box[3]).toBeCloseTo(0.5, 7);
  expect(result.extensions.EXT_geospatial_crs.extensions.EXT_geospatial_crs_wkid.epoch).toBe(2020);
  expect(result.extensionsUsed).toEqual(['EXT_geospatial_crs']);
  expect(result.extensionsRequired).toEqual(['EXT_geospatial_crs']);
});

test('hierarchy counts final metadata against the output budget and exposes nothing after abort', async () => {
  const options = createOptions(await inspect());
  const resources = options.resourceIds.map(identifier =>
    createResource(identifier, [6378137, 0, 0])
  );
  const sink = createMeshHierarchyTilesetSink({
    ...options,
    maxTotalBytes: resources.reduce((sum, resource) => sum + resource.glb.byteLength, 0)
  });
  for (const resource of resources) await sink.write(resource);
  await expect(sink.finalize!(REPORT)).rejects.toThrow();
  await sink.abort!(new Error('manifest exceeds budget'));
  expect(sink.getFiles()).toEqual([]);
});

test('hierarchy rejects incompatible source CRS and output coordinate epochs', async () => {
  const document = createDocument();
  document.extensions.EXT_geospatial_crs.extensions.EXT_geospatial_crs_wkid.wkid = 3857;
  const invalidOptions = createOptions(await inspect(document));
  expect(() => createMeshHierarchyTilesetSink(invalidOptions)).toThrow('native EPSG:4978');
  const options = createOptions(await inspect());
  const resource = createResource(options.resourceIds[0], [6378137, 0, 0]);
  await expect(
    createMeshHierarchyTilesetSink(options).write({
      ...resource,
      spatialReference: {...resource.spatialReference, coordinateEpoch: 2020}
    })
  ).rejects.toThrow('coordinate epoch');
});

test('sub-ULP local mesh bounds stay enclosed after ECEF subtree aggregation', async () => {
  const options = createOptions(await inspect());
  const sink = createMeshHierarchyTilesetSink(options);
  const positions = new Float32Array([0, 0, 0, 1e-10, 0, 0, 0, 1e-10, 0]);
  for (const identifier of options.resourceIds) {
    const resource = createResource(identifier, [6378137, 0, 0]);
    await sink.write({
      ...resource,
      glb: encodeMeshTile({
        topology: 'triangle-list',
        mode: 4,
        attributes: {POSITION: {value: positions, size: 3}}
      }),
      localBoundingBox: [
        [0, 0, 0],
        [positions[3], positions[7], 0]
      ]
    });
  }
  await sink.finalize!(REPORT);
  const result = await readDocument(sink);
  expect(result.root.boundingVolume.box[3]).toBeGreaterThan(positions[3] / 2);
  expect(result.root.children[0].boundingVolume.box[3]).toBeGreaterThan(positions[3] / 2);
});

test('root-only inspection rejects an external declaration before fetching or decoding it', async () => {
  const document = createDocument();
  document.root.content.uri = 'external.json';
  document.root.children = [];
  const requested: string[] = [];
  const fetcher: typeof fetch = async input => {
    requested.push(String(input));
    return new Response(JSON.stringify(document));
  };
  const source = createBrowserTilesetConversionSource({
    input: 'https://example.invalid/tileset.json',
    maxInputBytes: 4096,
    maxInputResources: 64,
    maxTilesetDocuments: 2,
    fetcher
  });
  const inspection = await source.inspect();
  const options = createOptions(inspection);
  expect(() => createMeshHierarchyTilesetSink(options)).toThrow('expanded metadata');
  await expect(
    createSelectedMeshConversionSource(inspection, {
      resourceIds: options.resourceIds,
      preserveHierarchy: true,
      source,
      fetcher,
      signal: new AbortController().signal,
      dracoLibraryOptions: {}
    })
  ).rejects.toMatchObject({code: 'MESH_HIERARCHY_UNSUPPORTED'});
  expect(requested).toEqual(['https://example.invalid/tileset.json']);
});

test('injected sources yielding uninspected placements fail explicitly before decoding', async () => {
  const inspection = await inspect();
  const options = createOptions(inspection);
  const selection = await createSelectedMeshConversionSource(inspection, {
    resourceIds: options.resourceIds,
    preserveHierarchy: true,
    signal: new AbortController().signal,
    dracoLibraryOptions: {},
    source: {
      inspect: async () => inspection,
      async *read() {
        yield {
          ...inspection.resources[0],
          resourceId: 'external/uninspected',
          data: new Uint8Array()
        };
      }
    }
  });
  await expect(
    selection.source.read(inspection)[Symbol.asyncIterator]().next()
  ).rejects.toMatchObject({code: 'INVALID_BROWSER_SELECTION'});
});
