import {describe, expect, test, vi} from 'vitest';
import {isBrowser} from '@loaders.gl/core';
import type {BoundingVolumes} from '@loaders.gl/tiles-3d/i3s';
import {NodeIndexDocument} from '../../../src/v4/i3s-converter/helpers/node-index-document';
import I3SConverter from '../../../src/v4/i3s-converter/i3s-converter';
import WriteQueue from '../../../src/v4/lib/utils/write-queue';
import {ConversionDump} from '../../../src/v4/lib/utils/conversion-dump';
const getConverter = ({slpk, instantNodeWriting} = {slpk: false, instantNodeWriting: false}) => {
  const converter = new I3SConverter();
  converter.options = {
    slpk,
    instantNodeWriting
  };
  converter.layers0Path = '.data/node-pages-test/layers/0';
  converter.writeQueue = new WriteQueue(new ConversionDump());
  return converter;
};
describe.skipIf(isBrowser)('tile-converter(i3s)#NodeIndexDocument', () => {
  test.each([
    false,
    true
  ])('finalization writes leaves without duplicating internal-node writes (children: %s)', async hasChildren => {
    const converter = getConverter();
    const writes = vi.spyOn(converter.writeQueue, 'enqueue').mockResolvedValue(undefined);
    const boundingVolumes: BoundingVolumes = {
      obb: {center: [1, 1, 1], halfSize: [2, 3, 4], quaternion: [0, 0, 0, 1]},
      mbs: [1, 2, 3, 4]
    };
    const node = await new NodeIndexDocument(1, converter).addData(
      NodeIndexDocument.createRootNodeIndexDocument(boundingVolumes)
    );
    if (hasChildren) {
      const child = await new NodeIndexDocument(2, converter).addData(
        NodeIndexDocument.createRootNodeIndexDocument(boundingVolumes)
      );
      await node.addChildren([child]);
    }
    await node.addNeighbors();
    expect(writes.mock.calls.map(([item]) => item.archiveKey)).toEqual([
      hasChildren ? 'nodes/2/3dNodeIndexDocument.json.gz' : 'nodes/1/3dNodeIndexDocument.json.gz'
    ]);
    expect(node.finalized).toBe(true);
    writes.mockRestore();
  });

  test('tile-converter(i3s)#NodeIndexDocument - Should create an instance of NodeIndexDocument class', async () => {
    const node = new NodeIndexDocument(0, getConverter());
    expect(node instanceof NodeIndexDocument).toBeTruthy();
    expect(node.inPageId).toBe(0);
    expect(node.id).toBe('root');
  });
  test('tile-converter(i3s)#NodeIndexDocument - Should create root node', async () => {
    const node = await NodeIndexDocument.createRootNode(
      {
        obb: {center: [1, 1, 1], halfSize: [2, 3, 4], quaternion: [4, 3, 2, 1]},
        mbs: [1, 2, 3, 4]
      },
      getConverter()
    );
    expect(node instanceof NodeIndexDocument).toBeTruthy();
    expect(node.inPageId).toBe(0);
    expect(node.id).toBe('root');
  });
  test('tile-converter(i3s)#NodeIndexDocument - Should create root node', async () => {
    const obb = {center: [1, 1, 1], halfSize: [2, 3, 4], quaternion: [4, 3, 2, 1]};
    const parentNode = await NodeIndexDocument.createRootNode(
      {obb, mbs: [1, 2, 3, 4]},
      getConverter()
    );
    const nodeInPage = {index: 5, obb};
    const emptyResources = {
      geometry: null,
      compressedGeometry: null,
      texture: null,
      sharedResources: null,
      meshMaterial: null,
      vertexCount: null,
      attributes: null,
      featureCount: null,
      boundingVolumes: null,
      hasUvRegions: false
    };
    const node = await NodeIndexDocument.createNode({
      parentNode,
      boundingVolumes: {obb, mbs: [1, 2, 3, 4]},
      lodSelection: [{metricType: 'metricType', maxError: 12345}],
      nodeInPage,
      resources: emptyResources,
      converter: getConverter()
    });
    expect(node instanceof NodeIndexDocument).toBeTruthy();
    expect(node.inPageId).toBe(5);
    expect(node.id).toBe('5');
  });
});
