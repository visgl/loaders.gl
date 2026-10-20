// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import type {Mesh, MeshGeometry} from '@loaders.gl/core/schema';
import {convertTableToMesh} from '@loaders.gl/core/schema-utils';
import {COPCWriter} from '@loaders.gl/copc';
import {encodePotreeDataset} from '@loaders.gl/potree';
import {ZipWriter} from '@loaders.gl/zip';
import {
  encodePotreeArchive,
  openPointCloudFile,
  extractMeshVertices
} from '@loaders.gl/tile-converter/v5/browser';
import {readZip} from 'test/common/read-zip';

/** Immutable small native-coordinate points. */
function createPoints(): Mesh {
  return {
    topology: 'point-list',
    mode: 0,
    schema: {fields: [], metadata: {}},
    attributes: {POSITION: {value: new Float64Array([1, 2, 3, 4, 5, 6]), size: 3}}
  };
}

/** STORE bundle fixture for reader boundary cases. */
async function createZip(
  files: Record<string, ArrayBuffer>,
  compression: 'store' | 'deflate' = 'store'
): Promise<Blob> {
  return new Blob([await ZipWriter.encode(files, {zip: {compression, zip64: 'never'}})]);
}

/** Encoded dataset resources using their original relative names. */
async function createFiles(): Promise<Record<string, ArrayBuffer>> {
  const dataset = await encodePotreeDataset(createPoints());
  return Object.fromEntries(
    [...dataset.files].map(([path, bytes]) => [path, bytes.slice().buffer])
  );
}

test.each([
  '1.3',
  '1.4',
  '1.8',
  '2.0'
])('Potree %s bundle round trip uses the unified source', async version => {
  const archive = await encodePotreeArchive(createPoints(), {
    maxArchiveBytes: 16384,
    potree: {version, maxOutputBytes: 8192}
  });
  const opened = await openPointCloudFile(archive, {format: 'potree-zip', maxFileBytes: 16384});
  try {
    const root = await opened.source.getRootTile();
    const content = await opened.source.loadTileContent(root);
    expect(content?.pointCount).toBe(2);
    expect(convertTableToMesh(content!.data).attributes.POSITION.value.length).toBe(6);
    if (version === '2.0')
      expect(Array.from(convertTableToMesh(content!.data).attributes.POSITION.value)).toEqual([
        1, 2, 3, 4, 5, 6
      ]);
    expect(
      (await readZip(await archive.arrayBuffer())).files[
        version === '2.0' ? 'metadata.json' : 'cloud.js'
      ]
    ).toBeDefined();
  } finally {
    await opened.close();
    await opened.close();
  }
});

test('modern Potree bundle preserves exact IDs and reads only the requested point range', async () => {
  const points = createPoints();
  points.attributes.id = {value: new BigUint64Array([2n ** 63n + 1n, 2n ** 63n + 2n]), size: 1};
  const child = createPoints();
  child.attributes.POSITION = {value: new Float64Array([7, 8, 9, 10, 11, 12]), size: 3};
  child.attributes.id = {value: new BigUint64Array([2n ** 63n + 3n, 2n ** 63n + 4n]), size: 1};
  const archive = await encodePotreeArchive(
    [
      {id: 'r', mesh: points},
      {id: 'r7', mesh: child}
    ],
    {maxArchiveBytes: 16384}
  );
  const reads = vi.spyOn(archive, 'slice');
  const opened = await openPointCloudFile(archive, {format: 'potree-zip', maxFileBytes: 16384});
  const root = await opened.source.getRootTile();
  const before = reads.mock.calls.length;
  const content = await opened.source.loadTileContent(root);
  const ranges = reads.mock.calls.slice(before).map(([begin, end]) => Number(end) - Number(begin));
  expect(ranges).toEqual([40]);
  const mesh = convertTableToMesh(content!.data);
  expect(Array.from(mesh.attributes.id.value)).toEqual([2n ** 63n + 1n, 2n ** 63n + 2n]);
  expect((await opened.source.getChildren(root)).map(tile => tile.id)).toEqual(['r7']);
  await opened.close();
  await expect(opened.source.loadTileContent(root)).rejects.toThrow();
  reads.mockRestore();
});

test('native COPC is a single-file source and destination through existing writer APIs', async () => {
  const bytes = COPCWriter.encodeSync(createPoints(), {
    copc: {scale: [0.001, 0.001, 0.001], offset: [0, 0, 0]}
  });
  expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('LASF');
  const opened = await openPointCloudFile(new Blob([bytes]), {format: 'copc', maxFileBytes: 16384});
  try {
    const root = await opened.source.getRootTile();
    const content = await opened.source.loadTileContent(root);
    expect(content?.pointCount).toBe(2);
    const position = convertTableToMesh(content!.data).attributes.POSITION.value;
    expect(
      Array.from(position, (value, index) => Number(value) + content!.cartographicOrigin[index % 3])
    ).toEqual([1, 2, 3, 4, 5, 6]);
  } finally {
    await opened.close();
  }
  await expect(opened.source.loadTileContent({id: '0-0-0-0'})).rejects.toThrow('closed');
});

test('archive authoring is deterministic and fails budgets and cancellation', async () => {
  const options = {maxArchiveBytes: 16384};
  const first = await encodePotreeArchive(createPoints(), options);
  const second = await encodePotreeArchive(createPoints(), options);
  expect(new Uint8Array(await first.arrayBuffer())).toEqual(
    new Uint8Array(await second.arrayBuffer())
  );
  await expect(encodePotreeArchive(createPoints(), {maxArchiveBytes: 1})).rejects.toThrow(
    /byte limit|budget/
  );
  await expect(encodePotreeArchive(createPoints(), {maxArchiveBytes: NaN})).rejects.toThrow(
    /limits/
  );
  await expect(
    encodePotreeArchive(createPoints(), {
      maxArchiveBytes: 16384,
      potree: {signal: AbortSignal.abort(new Error('cancelled'))}
    })
  ).rejects.toThrow('cancelled');
});

test('bundle opening rejects input, entry and resource limits before node decoding', async () => {
  const archive = await createZip(await createFiles());
  await expect(
    openPointCloudFile(archive, {format: 'potree-zip', maxFileBytes: 1})
  ).rejects.toThrow(/input budget/);
  await expect(
    openPointCloudFile(archive, {format: 'potree-zip', maxFileBytes: 16384, maxEntries: 1})
  ).rejects.toThrow(/entry.*limit|entry budget/);
  await expect(
    openPointCloudFile(archive, {format: 'potree-zip', maxFileBytes: 16384, maxResourceBytes: 1})
  ).rejects.toThrow(/read limit|decoded|compressed|resource/);
  await expect(
    openPointCloudFile(archive, {
      format: 'potree-zip',
      maxFileBytes: 16384,
      signal: AbortSignal.abort(new Error('cancelled'))
    })
  ).rejects.toThrow('cancelled');
});

test('explicit nested metadata keeps siblings inside the bundle', async () => {
  const files = await createFiles();
  const archive = await createZip(
    Object.fromEntries(Object.entries(files).map(([path, bytes]) => [`dataset/${path}`, bytes]))
  );
  await expect(
    openPointCloudFile(archive, {format: 'potree-zip', maxFileBytes: 16384})
  ).rejects.toThrow();
  const opened = await openPointCloudFile(archive, {
    format: 'potree-zip',
    maxFileBytes: 16384,
    metadataPath: 'dataset/metadata.json'
  });
  try {
    expect((await opened.source.getRootTile()).pointCount).toBe(2);
  } finally {
    await opened.close();
  }
});

test('unsupported compressed, encrypted and noncanonical bundles fail explicitly', async () => {
  const files = await createFiles();
  await expect(
    openPointCloudFile(await createZip(files, 'deflate'), {
      format: 'potree-zip',
      maxFileBytes: 16384
    })
  ).rejects.toThrow(/STORE/);
  const bytes = new Uint8Array(await (await createZip(files)).arrayBuffer());
  bytes[6] |= 1;
  await expect(
    openPointCloudFile(new Blob([bytes]), {format: 'potree-zip', maxFileBytes: 16384})
  ).rejects.toThrow(/encryption|flags|unencrypted/);
  await expect(createZip({'../metadata.json': files['metadata.json']})).rejects.toThrow(
    /canonical/
  );
  await expect(
    openPointCloudFile(await createZip({'é/metadata.json': files['metadata.json']}), {
      format: 'potree-zip',
      maxFileBytes: 16384
    })
  ).rejects.toThrow(/canonical/);
  await expect(
    openPointCloudFile(await createZip({...files, 'cloud.js': files['metadata.json']}), {
      format: 'potree-zip',
      maxFileBytes: 16384
    })
  ).rejects.toThrow();
});

test('mesh vertex harvesting retains stored rows and explicit attributes without mutation', async () => {
  const position = new Float64Array([1, 2, 3, 1, 2, 3, 4, 5, 6]);
  const mesh: MeshGeometry = {
    topology: 'triangle-list',
    mode: 4,
    attributes: {
      POSITION: {value: position, size: 3},
      COLOR_0: {value: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), size: 3},
      TEXCOORD_0: {value: new Float32Array(6), size: 2}
    },
    indices: {value: new Uint16Array([2, 1, 0, 2, 0, 1]), size: 1}
  };
  const points = extractMeshVertices(mesh, {attributes: ['COLOR_0'], maxPoints: 3});
  expect(points.attributes.POSITION.value).toBe(position);
  expect(points.topology).toBe('point-list');
  expect(points.indices).toBeUndefined();
  expect(Object.keys(points.attributes)).toEqual(['POSITION', 'COLOR_0']);
  expect(mesh.indices!.value.length).toBe(6);
  const archive = await encodePotreeArchive(points, {maxArchiveBytes: 16384});
  const opened = await openPointCloudFile(archive, {format: 'potree-zip', maxFileBytes: 16384});
  try {
    expect((await opened.source.getRootTile()).pointCount).toBe(3);
  } finally {
    await opened.close();
  }
  expect(() => extractMeshVertices(mesh, {attributes: [], maxPoints: 2})).toThrow(/budget/);
  expect(() => extractMeshVertices(mesh, {attributes: ['missing'], maxPoints: 3})).toThrow(
    /attribute/
  );
  expect(() =>
    extractMeshVertices(
      {...mesh, attributes: {POSITION: {...mesh.attributes.POSITION, byteStride: 32}}},
      {attributes: [], maxPoints: 3}
    )
  ).toThrow(/packed/);
});

test('invalid native COPC opening handles the source metadata rejection', async () => {
  await expect(
    openPointCloudFile(new Blob([new Uint8Array(589)]), {format: 'copc', maxFileBytes: 1024})
  ).rejects.toThrow();
});
