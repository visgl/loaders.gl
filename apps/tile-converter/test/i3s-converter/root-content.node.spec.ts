// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterAll, beforeAll, expect, test} from 'vitest';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parse} from '@loaders.gl/core';
import {DracoLoader, type DracoMesh} from '@loaders.gl/draco';
import {parseSLPKArchive} from '@loaders.gl/tiles-3d/i3s';
import {NodeFile} from '@loaders.gl/loader-utils';
import {Ellipsoid} from '@math.gl/geospatial';
import I3SConverter from '../../src/v4/i3s-converter/i3s-converter';
import {createLegacyB3dm} from '../utils/create-legacy-b3dm';

/** Per-file temporary directory; no large or downloaded fixtures enter the required suite. */
let directory: string;
/** Immutable source geometry reused by the four output profiles. */
let fixture: Awaited<ReturnType<typeof createLegacyB3dm>>;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tile-converter-root-content-'));
  fixture = await createLegacyB3dm();
  await writeFile(join(directory, 'legacy.b3dm'), new Uint8Array(fixture.b3dm));
  await writeFile(
    join(directory, 'modern.b3dm'),
    new Uint8Array((await createLegacyB3dm(true)).b3dm)
  );
});
afterAll(async () => {
  if (directory) await rm(directory, {recursive: true, force: true});
});

test.each([
  {
    name: 'legacy ADD root',
    modern: false,
    refine: 'ADD',
    instant: false,
    draco: true,
    children: false
  },
  {
    name: 'legacy REPLACE root written immediately',
    modern: false,
    refine: 'REPLACE',
    instant: true,
    draco: false,
    children: false
  },
  {
    name: 'modern ADD root',
    modern: true,
    refine: 'ADD',
    instant: false,
    draco: false,
    children: false
  },
  {
    name: 'modern REPLACE root with a child',
    modern: true,
    refine: 'REPLACE',
    instant: false,
    draco: true,
    children: true
  }
])('root-content SLPK persists every referenced node and geometry ($name)', async ({
  name,
  modern,
  refine,
  instant,
  draco,
  children
}) => {
  const inputPath = join(directory, `${name}.json`);
  const boundingVolume = {sphere: [...fixture.rtcCenter, 30]};
  const content = {uri: modern ? 'modern.b3dm' : 'legacy.b3dm'};
  await writeFile(
    inputPath,
    JSON.stringify({
      asset: {version: '1.0'},
      geometricError: 1,
      root: {
        refine,
        geometricError: 0,
        boundingVolume,
        content,
        ...(children ? {children: [{geometricError: 0, boundingVolume, content}]} : {})
      }
    })
  );
  const converter = new I3SConverter();
  await converter.convert({
    inputUrl: inputPath,
    outputPath: directory,
    tilesetName: name,
    egmFilePath: 'none',
    draco,
    instantNodeWriting: instant
  });
  const file = new NodeFile(join(directory, `${name}.slpk`));
  try {
    const archive = await parseSLPKArchive(file);
    const layer = JSON.parse(new TextDecoder().decode(await archive.getFile('', 'http')));
    expect(layer.store.normalReferenceFrame).toBe('earth-centered');
    const root = JSON.parse(new TextDecoder().decode(await archive.getFile('nodes/root', 'http')));
    const node = JSON.parse(new TextDecoder().decode(await archive.getFile('nodes/1', 'http')));
    expect(root.children.map((child: {id: string}) => child.id)).toEqual(['1']);
    expect(node.id).toBe('1');
    expect(node.parentNode.id).toBe('root');
    const page = JSON.parse(new TextDecoder().decode(await archive.getFile('nodepages/0', 'http')));
    expect(page.nodes).toHaveLength(children ? 3 : 2);
    for (const record of page.nodes.slice(1)) {
      const index = JSON.parse(
        new TextDecoder().decode(await archive.getFile(`nodes/${record.index}`, 'http'))
      );
      expect(index.id).toBe(String(record.index));
      expect(index.geometryData).toHaveLength(1);
      expect(await archive.getFile(`nodes/${record.index}/geometries/0`, 'http')).toBeInstanceOf(
        ArrayBuffer
      );
    }
    if (children) expect(node.children.map(child => child.id)).toEqual(['2']);
    const geometry = await archive.getFile('nodes/1/geometries/0', 'http');
    expect(Array.from(new Uint32Array(geometry, 0, 2))).toEqual([6, 2]);
    const positions = new Float32Array(geometry, 8, 18);
    for (let vertex = 0; vertex < 6; vertex++) {
      const cartographic = [0, 1, 2].map(axis => positions[vertex * 3 + axis] + node.mbs[axis]);
      const actual = Ellipsoid.WGS84.cartographicToCartesian(cartographic);
      for (let axis = 0; axis < 3; axis++) {
        expect(actual[axis]).toBeCloseTo(
          fixture.positions[vertex * 3 + axis] + fixture.rtcCenter[axis],
          3
        );
      }
    }
    new Float32Array(geometry, 8 + 18 * 4, 18).forEach((value, index) =>
      expect(value).toBeCloseTo(index % 3 === 2 ? 1 : 0, 12)
    );
    const featureIdsOffset = 8 + 18 * 4 * 2 + 6 * 4;
    expect(Array.from(new BigUint64Array(geometry, featureIdsOffset, 2))).toEqual([0n, 1n]);
    expect(Array.from(new Uint32Array(geometry, featureIdsOffset + 16, 4))).toEqual([0, 0, 1, 1]);
    if (draco) {
      const compressed = await archive.getFile('nodes/1/geometries/1', 'http');
      const decoded = (await parse(compressed, DracoLoader, {
        core: {worker: false, useLocalLibraries: true},
        draco: {shape: 'mesh', attributeNameEntry: 'i3s-attribute-type'}
      })) as DracoMesh;
      expect(decoded.loaderData.num_faces).toBe(2);
      const expectedCorners = Array.from({length: 6}, (_, vertex) => [
        ...positions.slice(vertex * 3, vertex * 3 + 3),
        Math.floor(vertex / 3)
      ]);
      const decodedCorners = Array.from(decoded.indices!.value, vertex => [
        ...decoded.attributes.POSITION.value.slice(vertex * 3, vertex * 3 + 3),
        decoded.attributes['feature-index'].value[vertex]
      ]);
      expect(canonicalizeTriangles(decodedCorners)).toEqual(canonicalizeTriangles(expectedCorners));
    }
  } finally {
    await file.close();
  }
});

/** Retains oriented triangles and feature ownership while allowing cyclic corners and face order. */
function canonicalizeTriangles(corners: number[][]): string[] {
  const triangles: string[] = [];
  for (let index = 0; index < corners.length; index += 3) {
    const triangle = corners.slice(index, index + 3);
    triangles.push(
      triangle
        .map((_, rotation) =>
          JSON.stringify([...triangle.slice(rotation), ...triangle.slice(0, rotation)])
        )
        .sort()[0]
    );
  }
  return triangles.sort();
}
