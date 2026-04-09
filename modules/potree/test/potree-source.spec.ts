import test from 'tape-promise/tape';
import {PotreeSource} from '@loaders.gl/potree';

const POTREE_BIN_URL = '@loaders.gl/potree/test/data/lion_takanawa';
const POTREE_LAZ_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/formats/potree/1.8/3dm_32_291_5744_1_nw-converted';

test('PotreeSource#initialize', async t => {
  const DS = PotreeSource;
  const source = DS.createDataSource(POTREE_BIN_URL, {});
  t.notOk(source.isReady);

  await source.init();

  t.ok(source.isReady);
  t.equal(source.metadata?.version, '1.7');
  t.equal(source.root?.header.childCount, 6);
  t.notOk(source.isSupported());
  t.end();
});

test.skip('PotreeSource#loadNodeContent - should return null for unsupported source', async t => {
  const DS = PotreeSource;
  const source = DS.createDataSource(POTREE_BIN_URL, {});

  const existingNodeContent = await source.loadNodeContent('360');
  t.equals(existingNodeContent, null);

  t.end();
});

test.skip('PotreeSource#loadNodeContent', async t => {
  const DS = PotreeSource;
  const source = DS.createDataSource(POTREE_LAZ_URL, {});

  await source.init();

  t.ok(source.isSupported());

  const existingNodeContent = await source.loadNodeContent('246');
  t.equals(existingNodeContent?.header?.vertexCount, 9933);

  t.end();
});

test('PotreeSource#loadNodeContent loads Potree 2 node with range requests', async t => {
  const fixture = makePotree2Fixture();
  const rangeFetches: string[] = [];
  const fetchFunction = async (url: string, options?: RequestInit): Promise<Response> => {
    const path = url.replace('memory://pointcloud/', '');
    const rangeHeader = new Headers(options?.headers).get('Range');
    const data = fixture[path];
    if (!data) {
      return new Response(null, {status: 404});
    }

    if (!rangeHeader) {
      return new Response(data);
    }

    rangeFetches.push(`${path}:${rangeHeader}`);
    const match = /bytes=(\d+)-(\d+)/.exec(rangeHeader);
    if (!match) {
      return new Response(null, {status: 416});
    }

    const start = Number(match[1]);
    const end = Number(match[2]);
    return new Response(data.slice(start, end + 1), {
      status: 206,
      headers: {'Content-Range': `bytes ${start}-${end}/${data.byteLength}`}
    });
  };

  const source = PotreeSource.createDataSource('memory://pointcloud/metadata.json', {
    core: {
      loadOptions: {
        core: {fetch: fetchFunction}
      }
    },
    tileRangeRequest: {batchDelayMs: 0}
  });

  await source.init();
  t.ok(source.isReady, 'source initializes');
  t.ok(source.isSupported(), 'Potree 2 metadata is supported');

  const [firstMesh, secondMesh] = await Promise.all([
    source.loadNodeContent('r'),
    source.loadNodeContent('')
  ]);

  t.ok(firstMesh, 'loads root mesh');
  t.equal(secondMesh?.header?.vertexCount, 2, 'loads root through legacy empty-node name');
  t.equal(firstMesh?.header?.vertexCount, 2, 'sets vertex count');
  t.deepEqual(
    Array.from(firstMesh?.attributes.POSITION.value as Float32Array),
    [1, 2, 3, 4, 5, 6],
    'decodes positions'
  );
  t.deepEqual(
    Array.from(firstMesh?.attributes.COLOR_0.value as Uint8Array),
    [255, 128, 0, 255, 0, 255, 128, 255],
    'decodes colors'
  );
  t.deepEqual(
    rangeFetches,
    ['hierarchy.bin:bytes=0-21', 'octree.bin:bytes=0-35'],
    'coalesces duplicate node content loads into one octree range request'
  );

  t.end();
});

function makePotree2Fixture(): Record<string, Blob> {
  const metadata = {
    version: '2.0',
    name: 'synthetic',
    points: 2,
    projection: '',
    boundingBox: {min: [0, 0, 0], max: [10, 10, 10]},
    tightBoundingBox: {min: [1, 2, 3], max: [4, 5, 6]},
    scale: [0.01, 0.01, 0.01],
    offset: [0, 0, 0],
    spacing: 1,
    encoding: 'DEFAULT',
    hierarchy: {firstChunkSize: 22},
    attributes: [
      {name: 'position', type: 'int32', numElements: 3, elementSize: 4, size: 12},
      {name: 'rgba', type: 'uint16', numElements: 3, elementSize: 2, size: 6}
    ]
  };

  const hierarchy = new ArrayBuffer(22);
  const hierarchyView = new DataView(hierarchy);
  hierarchyView.setUint8(0, 0);
  hierarchyView.setUint8(1, 0);
  hierarchyView.setUint32(2, 2, true);
  hierarchyView.setBigInt64(6, 0n, true);
  hierarchyView.setBigInt64(14, 36n, true);

  const octree = new ArrayBuffer(36);
  const octreeView = new DataView(octree);
  writePoint(octreeView, 0, [100, 200, 300], [65535, 32768, 0]);
  writePoint(octreeView, 18, [400, 500, 600], [0, 65535, 32768]);

  return {
    'metadata.json': new Blob([JSON.stringify(metadata)]),
    'hierarchy.bin': new Blob([hierarchy]),
    'octree.bin': new Blob([octree])
  };
}

function writePoint(view: DataView, byteOffset: number, position: number[], color: number[]): void {
  view.setInt32(byteOffset + 0, position[0], true);
  view.setInt32(byteOffset + 4, position[1], true);
  view.setInt32(byteOffset + 8, position[2], true);
  view.setUint16(byteOffset + 12, color[0], true);
  view.setUint16(byteOffset + 14, color[1], true);
  view.setUint16(byteOffset + 16, color[2], true);
}
