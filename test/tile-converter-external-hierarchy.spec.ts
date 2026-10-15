// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {
  convertTileset,
  createBrowserTilesetConversionSource
} from '@loaders.gl/tile-converter/v5/core';
import type {BrowserTilesetConversionInspection} from '@loaders.gl/tile-converter/v5/core';
import {
  createMeshHierarchyTilesetSink,
  createSelectedMeshConversionSource,
  createMeshConversionCodec,
  encodeMeshTile
} from '@loaders.gl/tile-converter/v5/adapters';
import type {EncodedMeshConversionResource} from '@loaders.gl/tile-converter/v5/adapters';

/** Tiny complete tree with repeated, two-level external placements and mixed document axes/versions. */
function createFixture() {
  const root = {
    asset: {version: '1.1', gltfUpAxis: 'Y'},
    geometricError: 500,
    extensions: {
      EXT_geospatial_crs: {
        format: 'wkid',
        extensions: {EXT_geospatial_crs_wkid: {authority: 'EPSG', wkid: 4978, epoch: 2020}}
      }
    },
    root: {
      geometricError: 10,
      refine: 'REPLACE',
      boundingVolume: {sphere: [0, 0, 0, 100]},
      transform: Array.from(
        new Matrix4().translate([6378137, 0, 0]).rotateZ(0.17).scale([2, 3, 4])
      ),
      content: {uri: 'coarse.glb'},
      children: [
        {
          geometricError: 3,
          boundingVolume: {sphere: [0, 0, 0, 50]},
          transform: Array.from(new Matrix4().translate([0, 10, 0])),
          content: {uri: 'nested/middle.json'}
        },
        {
          geometricError: 3,
          refine: 'ADD',
          boundingVolume: {sphere: [0, 0, 0, 50]},
          transform: Array.from(new Matrix4().translate([100, 0, 0])),
          content: {uri: 'nested/middle.json'}
        },
        {geometricError: 0, boundingVolume: {sphere: [0, 0, 0, 1]}, content: {uri: 'sibling.glb'}}
      ]
    }
  };
  const middle = {
    asset: {version: '1.1', gltfUpAxis: 'Z'},
    geometricError: 50,
    root: {
      geometricError: 4,
      refine: 'ADD',
      boundingVolume: {sphere: [0, 0, 0, 20]},
      transform: Array.from(new Matrix4().translate([5, 10, 15])),
      content: {uri: 'middle.glb'},
      children: [
        {
          geometricError: 1,
          refine: 'REPLACE',
          boundingVolume: {sphere: [0, 0, 0, 10]},
          transform: Array.from(new Matrix4().translate([0, 5, 0])),
          content: {uri: 'deep/final.json'}
        }
      ]
    }
  };
  const final = {
    asset: {version: '1.0', gltfUpAxis: 'Y'},
    geometricError: 6,
    root: {
      geometricError: 2,
      refine: 'REPLACE',
      boundingVolume: {sphere: [0, 0, 0, 1]},
      transform: Array.from(new Matrix4().translate([1, 2, 3])),
      content: {uri: 'leaf.glb'}
    }
  };
  const triangle = encodeMeshTile({
    topology: 'triangle-list',
    mode: 4,
    attributes: {POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3}}
  });
  const requested: string[] = [];
  const documents = new Map<string, unknown>([
    ['/entry.json', root],
    ['/nested/middle.json', middle],
    ['/nested/deep/final.json', final]
  ]);
  const fetcher: typeof fetch = async input => {
    const url = new URL(String(input));
    requested.push(url.href);
    const document = documents.get(url.pathname);
    if (document) return new Response(JSON.stringify(document));
    if (
      ['/coarse.glb', '/sibling.glb', '/nested/middle.glb', '/nested/deep/leaf.glb'].includes(
        url.pathname
      )
    )
      return new Response(triangle);
    throw new Error('Unconfined or unknown resource: ' + url.href);
  };
  const source = createBrowserTilesetConversionSource({
    input: 'https://example.invalid/entry.json?token=qualified',
    maxInputBytes: 65536,
    maxInputResources: 64,
    maxTilesetDocuments: 32,
    inspectNestedTilesets: true,
    fetcher
  });
  return {source, fetcher, requested};
}

/** Immutable metadata reused by sink cases; malformed cases clone before mutation. */
let inspection: BrowserTilesetConversionInspection;
beforeAll(async () => {
  inspection = await createFixture().source.inspect();
});

/** All binary placements selected under the existing output/precision policy. */
function createOptions(input = inspection) {
  return {
    inspection: input,
    resourceIds: input.resources.map(resource => resource.resourceId),
    maxTotalBytes: 65536,
    maxPositionError: 0.01
  };
}

/** Decodes through the real source/codec and retains encoded placement metadata for output conformance. */
async function convertFixture() {
  const fixture = createFixture();
  const source = await createSelectedMeshConversionSource(inspection, {
    resourceIds: createOptions().resourceIds,
    preserveHierarchy: true,
    signal: new AbortController().signal,
    dracoLibraryOptions: {},
    source: fixture.source,
    fetcher: fixture.fetcher
  });
  const sink = createMeshHierarchyTilesetSink(createOptions());
  const codec = createMeshConversionCodec({
    spatialContext: source.spatialContext,
    maxPositionError: 0.01,
    draco: false
  });
  const encoded: EncodedMeshConversionResource[] = [];
  const report = await convertTileset({
    source: source.source,
    sink,
    codec: {
      async *convert(resource, metadata, signal) {
        const descriptor = inspection.resources.find(
          item => item.resourceId === resource.contentResourceId
        )!;
        const transform = new Matrix4(descriptor.transform);
        const upAxis = descriptor.documentIndex === 1 || descriptor.documentIndex === 3 ? 'Z' : 'Y';
        const expectedPositions = [
          [0, 0, 0],
          [1, 0, 0],
          upAxis === 'Z' ? [0, 1, 0] : [0, 0, 1]
        ].flatMap(position => Array.from(transform.transformAsPoint(position)));
        expectedPositions.forEach((value, index) =>
          expect(resource.mesh.attributes.POSITION.value[index]).toBeCloseTo(value, 7)
        );
        for await (const output of codec.convert(resource, metadata, signal)) {
          encoded.push(output);
          yield output;
        }
      }
    },
    measureInputBytes: resource => resource.mesh.attributes.POSITION.value.byteLength,
    measureOutputBytes: resource => resource.glb.byteLength
  });
  const document = JSON.parse(
    await sink
      .getFiles()
      .find(file => file.resourceId === 'tileset.json')!
      .blob.text()
  );
  return {document, encoded, report, fixture};
}

test('external inspection retains parent identities for repeated and nested placements without payload requests', () => {
  expect(inspection.documents).toHaveLength(5);
  expect(inspection.documents!.map(document => document.parentResourceId)).toEqual([
    undefined,
    'tile-0-content-0',
    'tile-0-content-0/tile-0-content-0',
    'tile-1-content-0',
    'tile-1-content-0/tile-0-content-0'
  ]);
  expect(inspection.resources.map(resource => resource.documentIndex)).toEqual([0, 1, 2, 3, 4, 0]);
  expect(new Set(inspection.resources.map(resource => resource.resourceId)).size).toBe(6);
});

test('complete external conversion retains wrappers, independent root refinement, axes, errors and placed bounds', async () => {
  const {document, encoded, report, fixture} = await convertFixture();
  expect(report.outputResources).toBe(6);
  expect(fixture.requested).toHaveLength(6);
  expect(
    fixture.requested.every(url => !url.includes('.json') && url.includes('token=qualified'))
  ).toBe(true);
  expect(document.root.children).toHaveLength(3);
  expect(document.root.children[0].content).toBeUndefined();
  expect(document.root.children[0].refine).toBe('REPLACE');
  expect(document.root.children[1].refine).toBe('ADD');
  const middle = document.root.children[0].children[0];
  const final = middle.children[0].children[0];
  expect(middle.refine).toBe('ADD');
  expect(middle.children[0].refine).toBe('REPLACE');
  expect(final.refine).toBe('REPLACE');
  expect(document.root.children[0].geometricError).toBeCloseTo(50.01);
  expect(middle.geometricError).toBeGreaterThanOrEqual(16.01);
  expect(middle.children[0].geometricError).toBeCloseTo(6.01);
  expect(final.geometricError).toBeCloseTo(2.01); // 1.0 meter error is not scaled by parent matrices.
  expect(document.geometricError).toBeCloseTo(500.01);
  const placements = new Map(encoded.map((resource, index) => [index, resource.origin]));
  const contentNodes: {tile: typeof document.root; transform: Matrix4}[] = [];
  const stack = [{tile: document.root, transform: new Matrix4(document.root.transform)}];
  while (stack.length) {
    const {tile, transform} = stack.pop()!;
    if (tile.content) contentNodes.push({tile, transform});
    for (const child of tile.children ?? [])
      stack.push({tile: child, transform: new Matrix4(transform).multiplyRight(child.transform)});
  }
  expect(contentNodes).toHaveLength(6);
  for (const resource of encoded) {
    const index = encoded.indexOf(resource);
    const node = contentNodes.find(
      ({tile}) =>
        tile.content.uri ===
        [
          'meshes/0.glb',
          'meshes/2.glb',
          'meshes/4.glb',
          'meshes/6.glb',
          'meshes/8.glb',
          'meshes/9.glb'
        ][index]
    )!;
    resource.origin.forEach((value, axis) =>
      expect(node.transform.transformAsPoint([0, 0, 0])[axis]).toBeCloseTo(value, 7)
    );
  }
  expect(placements.get(1)).not.toEqual(placements.get(3));
  expect(document.extensions.EXT_geospatial_crs.extensions.EXT_geospatial_crs_wkid.epoch).toBe(
    2020
  );
});

test.each([
  'missingParent',
  'duplicateParent',
  'unreachable',
  'placement',
  'documentIndex',
  'childBearing',
  'referenceMetadata',
  'refine',
  'metadata',
  'epoch',
  'crs',
  'datasetError',
  'documentLimit',
  'tileLimit'
] as const)('external hierarchy rejects %s metadata before decoding', mode => {
  const input = structuredClone(inspection);
  const documents = input.documents! as Array<NonNullable<typeof input.documents>[number]>;
  if (mode === 'missingParent') Object.assign(documents[1], {parentResourceId: undefined});
  if (mode === 'duplicateParent')
    Object.assign(documents[2], {parentResourceId: documents[1].parentResourceId});
  if (mode === 'unreachable')
    documents.push({...structuredClone(documents[4]), parentResourceId: 'not-a-placement'});
  if (mode === 'placement') (documents[1].parentTransform as number[])[12] += 1;
  if (mode === 'documentIndex') Object.assign(input.resources[1], {documentIndex: 0});
  if (mode === 'childBearing') input.tileset.root!.children![0].children = [{geometricError: 0}];
  if (mode === 'referenceMetadata')
    Object.assign(input.tileset.root!.children![0].content!, {group: 0});
  if (mode === 'refine') Object.assign(documents[1].tileset.root!, {refine: undefined});
  if (mode === 'metadata') Object.assign(documents[1].tileset, {metadata: {class: 'unknown'}});
  if (mode === 'epoch' || mode === 'crs')
    Object.assign(documents[1].tileset, {
      extensions: {
        EXT_geospatial_crs: {
          format: 'wkid',
          extensions: {
            EXT_geospatial_crs_wkid: {
              authority: 'EPSG',
              wkid: mode === 'crs' ? 3857 : 4978,
              epoch: mode === 'epoch' ? 2021 : 2020
            }
          }
        }
      }
    });
  if (mode === 'datasetError') Object.assign(documents[1].tileset, {geometricError: NaN});
  if (mode === 'documentLimit') documents.push(...Array.from({length: 32}, () => documents[1]));
  if (mode === 'tileLimit')
    documents[1].tileset.root!.children!.push(
      ...Array.from({length: 256}, () => ({geometricError: 0}))
    );
  expect(() => createMeshHierarchyTilesetSink(createOptions(input))).toThrow();
});

test('the 32-document placement boundary qualifies without binary reads', async () => {
  const documents = Array.from({length: 32}, (_, index) => ({
    asset: {version: '1.1'},
    ...(index === 0
      ? {
          extensions: {
            EXT_geospatial_crs: {
              format: 'wkid',
              extensions: {EXT_geospatial_crs_wkid: {authority: 'EPSG', wkid: 4978}}
            }
          }
        }
      : {}),
    root: {
      geometricError: 1,
      refine: 'REPLACE',
      boundingVolume: {sphere: [0, 0, 0, 1]},
      content: {uri: index === 31 ? 'leaf.glb' : `document-${index + 1}.json`}
    }
  }));
  let requests = 0;
  const source = createBrowserTilesetConversionSource({
    input: 'https://example.invalid/document-0.json',
    maxInputBytes: 65536,
    maxInputResources: 64,
    maxTilesetDocuments: 32,
    inspectNestedTilesets: true,
    fetcher: async input => {
      const index = Number(new URL(String(input)).pathname.match(/document-(\d+)\.json/)?.[1]);
      if (!Number.isSafeInteger(index)) throw new Error('Binary content requested');
      requests++;
      return new Response(JSON.stringify(documents[index]));
    }
  });
  const input = await source.inspect();
  expect(requests).toBe(32);
  expect(() => createMeshHierarchyTilesetSink(createOptions(input))).not.toThrow();
});
