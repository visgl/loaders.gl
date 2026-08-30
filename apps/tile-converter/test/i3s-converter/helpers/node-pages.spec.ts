import {describe, expect, test} from 'vitest';
import {default as NodePages} from '../../../src/i3s-converter/helpers/node-pages';
import {isBrowser} from '@loaders.gl/core';
import I3SConverter from '../../../src/i3s-converter/i3s-converter';
import WriteQueue from '../../../src/lib/utils/write-queue';
import {ConversionDump} from '../../../src/lib/utils/conversion-dump';
const getConverter = ({instantNodeWriting} = {instantNodeWriting: false}) => {
  const converter = new I3SConverter();
  converter.options = {instantNodeWriting};
  converter.layers0Path = '.data/node-pages-test/layers/0';
  converter.writeQueue = new WriteQueue(new ConversionDump());
  return converter;
};
/** @type {import('@loaders.gl/i3s').NodeInPage} */
const newNodeStub = {
  index: 0,
  lodThreshold: 123.123,
  obb: {
    center: [-75.61326768454079, 40.0434352648084, 9.998422015481468],
    halfSize: [142.18765285081892, 142.18765285081892, 142.18765285081892],
    quaternion: [0, 0, 0, 1]
  },
  children: []
};
/**
 * Return material and geometry from test objects
 * @param nodePages
 * @param id
 * @returns {{material: Object, geometry: Object}}
 */
function getMaterialAndGeometryFromNode(nodePages, id) {
  const mesh = (nodePages &&
    nodePages.nodePages &&
    nodePages.nodePages[0] &&
    nodePages.nodePages[0].nodes &&
    nodePages.nodePages[0].nodes[id] &&
    nodePages.nodePages[0].nodes[id].mesh) || {material: null, geometry: null};
  const material = (mesh && mesh.material) || {};
  const geometry = (mesh && mesh.geometry) || {};
  return {material, geometry};
}
describe.skipIf(isBrowser)('tile-converter(i3s)#NodePages', () => {
  test('tile-converter(i3s)#NodePages - Should create an instance of NodePages class', async () => {
    const nodePages = new NodePages(() => {}, 64, getConverter());
    expect(nodePages instanceof NodePages).toBeTruthy();
    expect(nodePages.nodesCounter).toBe(0);
  });
  test('tile-converter(i3s)#NodePages - Should push node into the last nodePage', async () => {
    const nodePages = new NodePages(() => {}, 64, getConverter());
    await nodePages.push(newNodeStub);
    expect(nodePages.nodesCounter).toBe(1);
    expect(nodePages.nodePages[0].nodes[0]).toEqual({
      ...newNodeStub,
      index: 0
    });
  });
  test('tile-converter(i3s)#NodePages - Push method should return the new node', async () => {
    const nodePages = new NodePages(() => {}, 64, getConverter());
    nodePages.push(newNodeStub);
    const newNodeIndex = await nodePages.push(newNodeStub);
    expect(newNodeIndex).toBe(newNodeStub);
  });
  test('tile-converter(i3s)#NodePages - Push method should create new nodePage when "last nodePage.length" === "nodesPerPage"', async () => {
    const nodePages = new NodePages(() => {}, 64, getConverter());
    for (let i = 0; i <= 65; i++) {
      nodePages.push(newNodeStub);
    }
    expect(nodePages.nodePages.length).toBe(2);
    expect(nodePages.nodePages[1].nodes.length).toBe(2);
  });
  test('tile-converter(i3s)#NodePages - Should consume "nodesPerPage" in constructor', async () => {
    const nodePages = new NodePages(() => {}, 16, getConverter());
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    expect(nodePages.nodePages.length).toBe(5);
    expect(nodePages.nodePages[4].nodes.length).toBe(2);
  });
  test('tile-converter(i3s)#NodePages - Push method should add children relation into the parent node', async () => {
    const nodePages = new NodePages(() => {}, 64, getConverter());
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    await nodePages.push(newNodeStub, 3);
    expect(nodePages.nodePages[0].nodes[3].children?.includes(66)).toBeTruthy();
  });
  test('tile-converter(i3s)#NodePages - Push method should set "resource" property in the "mesh" equal to the new node index', async () => {
    const newNodeWithMesh = {
      ...newNodeStub,
      mesh: {
        geometry: {
          definition: 0,
          resource: 0
        },
        material: {definition: 0},
        attribute: {resource: 0}
      }
    };
    const nodePages = new NodePages(() => {}, 64, getConverter());
    await nodePages.push(newNodeWithMesh);
    const {material: material0, geometry: geometry0} = getMaterialAndGeometryFromNode(nodePages, 0);
    expect(geometry0.resource).toBe(0);
    expect(material0).toEqual({definition: 0});
    await nodePages.push(newNodeWithMesh);
    const {material: material1, geometry: geometry1} = getMaterialAndGeometryFromNode(nodePages, 1);
    expect(geometry1.resource).toBe(1);
    expect(material1).toEqual({definition: 0});
  });
  test('tile-converter(i3s)#NodePages - Should get getNodeById ', async () => {
    const nodePages = new NodePages(() => {}, 16, getConverter());
    for (let i = 0; i <= 65; i++) {
      await nodePages.push({...newNodeStub});
    }
    const node = await nodePages.getNodeById(25);
    expect(node).toEqual({...newNodeStub, index: 25});
  });
  test('tile-converter(i3s)#NodePages - Should save node pages to the file system ', async () => {
    const savePaths: string[] = [];
    const writeFileFuncForSlpk = (layerPath, data, slpk) => {
      savePaths.push(layerPath);
    };
    const nodePages = new NodePages(
      writeFileFuncForSlpk,
      64,
      getConverter({instantNodeWriting: true})
    );
    for (let i = 0; i <= 65; i++) {
      await nodePages.push({...newNodeStub});
    }
    expect(savePaths.length).toBe(66);
    expect(savePaths[55]).toBe('.data/node-pages-test/layers/0/nodepages');
  });
  test('tile-converter(i3s)#NodePages - Update material method should set "material" object in the "mesh" with node index and material id', async () => {
    /** @type {import('@loaders.gl/i3s').NodeInPage} */
    const newNodeWithMesh = {
      ...newNodeStub,
      mesh: {
        geometry: {
          definition: 0,
          resource: 0
        },
        material: {
          definition: 0
        },
        attribute: {
          resource: 0
        }
      }
    };
    const nodePages = new NodePages(() => {}, 64, getConverter());
    NodePages.updateMaterialByNodeId(await nodePages.push(newNodeWithMesh), 0);
    const {material: material0} = getMaterialAndGeometryFromNode(nodePages, 0);
    expect(material0.resource).toBe(0);
    expect(material0.definition).toBe(0);
    NodePages.updateMaterialByNodeId(await nodePages.push(newNodeWithMesh), 3);
    const {material: material1} = getMaterialAndGeometryFromNode(nodePages, 1);
    expect(material1.resource).toBe(1);
    expect(material1.definition).toBe(3);
  });
  test('tile-converter(i3s)#NodePages - Should save node pages', async () => {
    const savedNodePages: any[] = [];
    const writeFileFunc = async (layerPath, data, slpk) => {
      savedNodePages.push(data);
    };
    const converter = getConverter({instantNodeWriting: false});
    const nodePages = new NodePages(writeFileFunc, 64, converter);
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    await nodePages.save();
    await converter.writeQueue.finalize();
    expect(typeof savedNodePages[1]).toBe('string');
    expect(savedNodePages.length).toBe(3);
  });
  test('tile-converter(i3s)#NodePages - Should save node pages for slpk packaging', async () => {
    const savedNodePages: any[] = [];
    const writeFileFuncForSlpk = (layerPath, data, slpk) => {
      savedNodePages.push(data);
    };
    const converter = getConverter({instantNodeWriting: false});
    const nodePages = new NodePages(writeFileFuncForSlpk, 64, converter);
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    await nodePages.save();
    await converter.writeQueue.finalize();
    expect(typeof savedNodePages[1]).toBe('string');
    expect(savedNodePages.length).toBe(3);
  });
  test('tile-converter(i3s)#NodePages - Should save node pages for slpk packaging', async () => {
    const savedNodePages: any[] = [];
    const writeFileFuncForSlpk = (layerPath, data, slpk) => {
      savedNodePages.push(data);
    };
    const converter = getConverter({instantNodeWriting: false});
    const nodePages = new NodePages(writeFileFuncForSlpk, 64, converter);
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    await nodePages.save();
    await converter.writeQueue.finalize();
    expect(typeof savedNodePages[1]).toBe('string');
    expect(savedNodePages.length).toBe(3);
  });
});
