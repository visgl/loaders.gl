import test from 'tape-promise/tape';
import {default as NodePages} from '../../../src/i3s-converter/helpers/node-pages';
import {isBrowser} from '@loaders.gl/core';
import I3SConverter from '../../../src/i3s-converter/i3s-converter';
import WriteQueue from '../../../src/lib/utils/write-queue';

const getConverter = ({slpk, instantNodeWriting} = {slpk: false, instantNodeWriting: false}) => {
  const converter = new I3SConverter();
  converter.options = {
    slpk,
    instantNodeWriting
  };
  converter.layers0Path = '.data/node-pages-test/layers/0';
  converter.writeQueue = new WriteQueue();
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

test('tile-converter - I3SConverter#NodePages', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  t.test('Should create an instance of NodePages class', async (st) => {
    const nodePages = new NodePages(() => {}, 64, getConverter());
    st.ok(nodePages instanceof NodePages);
    st.equal(nodePages.nodesCounter, 0);
    st.end();
  });

  t.test('Should push node into the last nodePage', async (st) => {
    const nodePages = new NodePages(() => {}, 64, getConverter());

    await nodePages.push(newNodeStub);
    st.equal(nodePages.nodesCounter, 1);
    st.deepEqual(nodePages.nodePages[0].nodes[0], {
      ...newNodeStub,
      index: 0
    });
    st.end();
  });

  t.test('Push method should return the new node', async (st) => {
    const nodePages = new NodePages(() => {}, 64, getConverter());
    nodePages.push(newNodeStub);
    const newNodeIndex = await nodePages.push(newNodeStub);
    st.equal(newNodeIndex, newNodeStub);
    st.end();
  });

  t.test(
    'Push method should create new nodePage when "last nodePage.length" === "nodesPerPage"',
    async (st) => {
      const nodePages = new NodePages(() => {}, 64, getConverter());
      for (let i = 0; i <= 65; i++) {
        nodePages.push(newNodeStub);
      }
      st.equal(nodePages.nodePages.length, 2);
      st.equal(nodePages.nodePages[1].nodes.length, 2);
      st.end();
    }
  );

  t.test('Should consume "nodesPerPage" in constructor', async (st) => {
    const nodePages = new NodePages(() => {}, 16, getConverter());
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    st.equal(nodePages.nodePages.length, 5);
    st.equal(nodePages.nodePages[4].nodes.length, 2);
    st.end();
  });

  t.test('Push method should add children relation into the parent node', async (st) => {
    const nodePages = new NodePages(() => {}, 64, getConverter());
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    await nodePages.push(newNodeStub, 3);
    st.ok(nodePages.nodePages[0].nodes[3].children?.includes(66));
    st.end();
  });

  t.test(
    'Push method should set "resource" property in the "mesh" equal to the new node index',
    async (st) => {
      /** @type {import('@loaders.gl/i3s').NodeInPage} */
      const newNodeWithMesh = {
        ...newNodeStub,
        mesh: {
          // @ts-expect-error
          geometry: {
            definition: 0
          }
        }
      };
      const nodePages = new NodePages(() => {}, 64, getConverter());
      await nodePages.push(newNodeWithMesh);
      const {material: material0, geometry: geometry0} = getMaterialAndGeometryFromNode(
        nodePages,
        0
      );
      st.equal(geometry0.resource, 0);
      st.deepEqual(material0, {});
      await nodePages.push(newNodeWithMesh);
      const {material: material1, geometry: geometry1} = getMaterialAndGeometryFromNode(
        nodePages,
        1
      );
      st.equal(geometry1.resource, 1);
      st.deepEqual(material1, {});
      st.end();
    }
  );

  t.test('Should get getNodeById ', async (st) => {
    const nodePages = new NodePages(() => {}, 16, getConverter());
    for (let i = 0; i <= 65; i++) {
      await nodePages.push({...newNodeStub});
    }
    const node = await nodePages.getNodeById(25);
    st.deepEqual(node, {...newNodeStub, index: 25});
    st.end();
  });

  t.test('Should save node pages to the file system ', async (st) => {
    const savePaths = [];
    const writeFileFuncForSlpk = (layerPath, data, slpk) => {
      savePaths.push(layerPath);
    };
    const nodePages = new NodePages(
      writeFileFuncForSlpk,
      64,
      getConverter({slpk: false, instantNodeWriting: true})
    );
    for (let i = 0; i <= 65; i++) {
      await nodePages.push({...newNodeStub});
    }
    st.equal(savePaths.length, 66);
    st.equal(savePaths[55], '.data/node-pages-test/layers/0/nodepages/0');
    st.end();
  });

  t.test(
    'Update material method should set "material" object in the "mesh" with node index and material id',
    async (st) => {
      /** @type {import('@loaders.gl/i3s').NodeInPage} */
      const newNodeWithMesh = {
        ...newNodeStub,
        mesh: {
          // @ts-expect-error
          geometry: {
            definition: 0
          }
        }
      };
      const nodePages = new NodePages(() => {}, 64, getConverter());
      NodePages.updateMaterialByNodeId(await nodePages.push(newNodeWithMesh), 0);
      const {material: material0} = getMaterialAndGeometryFromNode(nodePages, 0);
      st.equal(material0.resource, 0);
      st.equal(material0.definition, 0);
      NodePages.updateMaterialByNodeId(await nodePages.push(newNodeWithMesh), 3);
      const {material: material1} = getMaterialAndGeometryFromNode(nodePages, 1);
      st.equal(material1.resource, 1);
      st.equal(material1.definition, 3);
      st.end();
    }
  );

  t.test('Should save node pages', async (st) => {
    const savedNodePages = [];
    const writeFileFunc = async (layerPath, data, slpk) => {
      savedNodePages.push(data);
    };
    const converter = getConverter({slpk: false, instantNodeWriting: false});
    const nodePages = new NodePages(writeFileFunc, 64, converter);
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    await nodePages.save();
    await converter.writeQueue.finalize();
    st.equal(typeof savedNodePages[1], 'string');
    st.equal(savedNodePages.length, 2);
    st.end();
  });

  t.test('Should save node pages for slpk packaging', async (st) => {
    const savedNodePages = [];
    const writeFileFuncForSlpk = (layerPath, data, slpk) => {
      savedNodePages.push(data);
    };
    const converter = getConverter({slpk: true, instantNodeWriting: false});
    const nodePages = new NodePages(writeFileFuncForSlpk, 64, converter);
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    await nodePages.save();
    await converter.writeQueue.finalize();
    st.equal(typeof savedNodePages[1], 'string');
    st.equal(savedNodePages.length, 3);
    st.end();
  });

  t.test('Should save node pages', async (st) => {
    const savedNodePages = [];
    const writeFileFunc = (layerPath, data, slpk) => {
      savedNodePages.push(data);
    };
    const converter = getConverter();
    const nodePages = new NodePages(writeFileFunc, 64, converter);
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    await nodePages.save();
    await converter.writeQueue.finalize();
    st.equal(typeof savedNodePages[1], 'string');
    st.equal(savedNodePages.length, 2);
    st.end();
  });

  t.test('Should save node pages for slpk packaging', async (st) => {
    const savedNodePages = [];
    const writeFileFuncForSlpk = (layerPath, data, slpk) => {
      savedNodePages.push(data);
    };
    const converter = getConverter({slpk: true, instantNodeWriting: false});
    const nodePages = new NodePages(writeFileFuncForSlpk, 64, converter);
    for (let i = 0; i <= 65; i++) {
      await nodePages.push(newNodeStub);
    }
    await nodePages.save();
    await converter.writeQueue.finalize();
    st.equal(typeof savedNodePages[1], 'string');
    st.equal(savedNodePages.length, 3);
    st.end();
  });

  t.end();
});
