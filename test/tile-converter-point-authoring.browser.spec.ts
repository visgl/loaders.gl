// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles/bundled';
import {Tiles3DTilesetSchema} from '@loaders.gl/3d-tiles/tileset-zod-schema';
import {createTilesetSpatialReference} from '@loaders.gl/tiles';
import {PointCloudTileSource} from '@loaders.gl/tiles/point-cloud-tile-source';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import type {Mesh} from '@loaders.gl/schema';
import {convertPointCloudToTileset} from '@loaders.gl/tile-converter/v5/browser';
import {convertPointCloudToTileset as convertRoot} from '@loaders.gl/tile-converter/v5';
import JSZip from 'jszip';

/** Explicit native ECEF frame for decoded source points. */
const REFERENCE = createTilesetSpatialReference({
  sourceCrs: 'EPSG:4978',
  heightReference: 'ellipsoidal',
  coordinateFrame: 'geocentric',
  axisOrder: 'xyz'
});
/** Small immutable dataset with distinct positions and colors. */
const ATTRIBUTES = {
  POSITION: {
    value: new Float64Array([
      6378137.125, 0.25, 0.5, 6378138.125, 1.25, 1.5, 6378139.125, 2.25, 2.5, 6378140.125, 3.25, 3.5
    ]),
    size: 3
  },
  COLOR_0: {value: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), size: 3}
};
/** Required output limits and tiny indexing limits exercising descendant traversal. */
const OPTIONS = {
  spatialReference: REFERENCE,
  maxTotalBytes: 16384,
  maxTiles: 16,
  geometricError: 0.000001,
  tiling: {
    nodePointLimit: 1,
    maximumDepth: 2,
    maxInputBytes: 1024,
    maxIndexBytes: 1024,
    maxTileBytes: 1024,
    maxNodes: 16
  }
};
/** Loader-compatible point Mesh; metadata is not inferred by authoring. */
function createMesh(): Mesh {
  return {
    attributes: ATTRIBUTES,
    topology: 'point-list',
    mode: 0,
    schema: {fields: [], metadata: {}}
  };
}

afterEach(() => vi.restoreAllMocks());

test.each([
  'mesh',
  'arrow'
] as const)('decoded %s points author complete additive files with RTC placement', async shape => {
  expect(convertRoot).toBe(convertPointCloudToTileset);
  const close = vi.spyOn(PointCloudTileSource.prototype, 'close');
  const input = shape === 'mesh' ? createMesh() : makeMeshArrowTable(ATTRIBUTES);
  const result = await convertPointCloudToTileset(input, OPTIONS);
  expect(close).toHaveBeenCalledOnce();
  expect(result.pointCount).toBe(4);
  expect(result.archive).toBeUndefined();
  const tileset = JSON.parse(
    await result.files.find(file => file.resourceId === 'tileset.json')!.blob.text()
  );
  expect(Tiles3DTilesetSchema.safeParse(tileset).success).toBe(true);
  expect(tileset.root.refine).toBe('ADD');
  expect(tileset.root.children.length).toBeGreaterThan(1);
  const rows: number[][] = [];
  for (const child of tileset.root.children) {
    const file = result.files.find(file => file.resourceId === child.content.uri)!;
    const tile = await parse(await file.blob.arrayBuffer(), Tiles3DLoader, {worker: false});
    const positions = tile.attributes.positions!;
    const colors = tile.attributes.colors!.value;
    for (let point = 0; point < positions.length / 3; point++) {
      rows.push(
        [0, 1, 2]
          .map(axis => positions[point * 3 + axis] + tile.rtcCenter![axis])
          .concat(Array.from(colors.slice(point * 3, point * 3 + 3)))
      );
    }
  }
  expect(rows.sort((left, right) => left[0] - right[0])).toEqual(
    [0, 1, 2, 3].map(point =>
      Array.from(ATTRIBUTES.POSITION.value.slice(point * 3, point * 3 + 3)).concat(
        Array.from(ATTRIBUTES.COLOR_0.value.slice(point * 3, point * 3 + 3))
      )
    )
  );
  expect(result.report.outputResources).toBe(tileset.root.children.length);
  expect(result.report.inputBytes).toBeGreaterThanOrEqual(
    ATTRIBUTES.POSITION.value.byteLength + ATTRIBUTES.COLOR_0.value.byteLength
  );
  expect(result.report.outputBytes).toBe(
    result.files
      .filter(file => file.resourceId.endsWith('.pnts'))
      .reduce((bytes, file) => bytes + file.blob.size, 0)
  );
  expect(Array.from(ATTRIBUTES.POSITION.value)).toEqual([
    6378137.125, 0.25, 0.5, 6378138.125, 1.25, 1.5, 6378139.125, 2.25, 2.5, 6378140.125, 3.25, 3.5
  ]);
});

test('point authoring optionally packages complete files as indexed 3TZ', async () => {
  const result = await convertPointCloudToTileset(createMesh(), {
    ...OPTIONS,
    archive: {maxArchiveBytes: 32768}
  });
  const archive = await JSZip.loadAsync(await result.archive!.arrayBuffer(), {checkCRC32: true});
  expect(archive.file('@3dtilesIndex1@')).not.toBeNull();
  for (const file of result.files) {
    expect(await archive.file(file.resourceId)!.async('arraybuffer')).toEqual(
      await file.blob.arrayBuffer()
    );
  }
});

test.each([
  {maxTotalBytes: 1},
  {maxTiles: 1},
  {tiling: {...OPTIONS.tiling, maxTileBytes: 1}},
  {archive: {maxArchiveBytes: 1}}
])('authoring releases its source after a resource budget failure: %j', async patch => {
  const close = vi.spyOn(PointCloudTileSource.prototype, 'close');
  await expect(convertPointCloudToTileset(createMesh(), {...OPTIONS, ...patch})).rejects.toThrow();
  expect(close).toHaveBeenCalledOnce();
});

test('authoring rejects an undeclared ECEF frame and invalid archive limits before indexing', async () => {
  const metadata = vi.spyOn(PointCloudTileSource.prototype, 'getMetadata');
  await expect(
    convertPointCloudToTileset(createMesh(), {
      ...OPTIONS,
      spatialReference: createTilesetSpatialReference({sourceCrs: 'EPSG:4326'})
    })
  ).rejects.toMatchObject({code: 'POINT_CLOUD_TILESET_FRAME_UNSUPPORTED'});
  await expect(
    convertPointCloudToTileset(createMesh(), {...OPTIONS, archive: {maxArchiveBytes: -1}})
  ).rejects.toMatchObject({code: 'INVALID_ARCHIVE_BYTE_LIMIT'});
  expect(metadata).not.toHaveBeenCalled();
});

test('unsupported point attributes fail without returning a partial dataset', async () => {
  const close = vi.spyOn(PointCloudTileSource.prototype, 'close');
  await expect(
    convertPointCloudToTileset(
      {
        ...createMesh(),
        attributes: {...ATTRIBUTES, classification: {value: new Uint8Array(4), size: 1}}
      },
      OPTIONS
    )
  ).rejects.toMatchObject({code: 'POINT_CLOUD_ATTRIBUTE_UNSUPPORTED'});
  expect(close).toHaveBeenCalledOnce();
});

test('cancellation during conversion and before indexing rejects and releases owned state', async () => {
  const controller = new AbortController();
  const close = vi.spyOn(PointCloudTileSource.prototype, 'close');
  await expect(
    convertPointCloudToTileset(createMesh(), {
      ...OPTIONS,
      signal: controller.signal,
      onProgress: progress => {
        if (progress.outputResources > 0) controller.abort(new Error('cancel authoring'));
      }
    })
  ).rejects.toThrow('cancel authoring');
  expect(close).toHaveBeenCalledOnce();
  close.mockClear();
  await expect(
    convertPointCloudToTileset(createMesh(), {...OPTIONS, signal: controller.signal})
  ).rejects.toThrow('cancel authoring');
  expect(close).not.toHaveBeenCalled();
});

test('a zero-depth tiler retains terminal overflow rather than dropping source rows', async () => {
  const result = await convertPointCloudToTileset(createMesh(), {
    ...OPTIONS,
    tiling: {...OPTIONS.tiling, maximumDepth: 0}
  });
  expect(result.pointCount).toBe(4);
  expect(result.report.outputResources).toBe(1);
  const tile = await parse(await result.files[0].blob.arrayBuffer(), Tiles3DLoader, {
    worker: false
  });
  expect(tile.attributes.positions!.length / 3).toBe(4);
});

test('authoring enforces measured precision and rejects empty input', async () => {
  const close = vi.spyOn(PointCloudTileSource.prototype, 'close');
  const input = {
    ...createMesh(),
    attributes: {
      POSITION: {value: new Float64Array([6378137.1, 0.2, 0.3, 6378138.2, 1.4, 1.5]), size: 3}
    }
  };
  await expect(
    convertPointCloudToTileset(input, {
      ...OPTIONS,
      geometricError: 0,
      tiling: {...OPTIONS.tiling, maximumDepth: 0}
    })
  ).rejects.toMatchObject({code: 'POINT_CLOUD_PRECISION_EXCEEDED'});
  await expect(
    convertPointCloudToTileset(
      {...createMesh(), attributes: {POSITION: {value: new Float64Array(0), size: 3}}},
      OPTIONS
    )
  ).rejects.toThrow();
  expect(close).toHaveBeenCalledTimes(2);
});
