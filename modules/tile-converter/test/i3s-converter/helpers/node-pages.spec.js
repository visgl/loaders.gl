import test from 'tape-promise/tape';
import {NodePages} from '@loaders.gl/tile-converter';
import {isBrowser} from '@loaders.gl/core';

const newNodeStub = {
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

test('tile-converter - Converters#NodePages', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  t.test('Should create an instance of NodePages class', async (st) => {
    const nodePages = new NodePages(() => {}, 64);
    st.ok(nodePages instanceof NodePages);
    st.equal(nodePages.nodesCounter, 0);
    st.end();
  });

  t.test('Should push node into the last nodePage', async (st) => {
    const nodePages = new NodePages(() => {}, 64);

    nodePages.push(newNodeStub);
    st.equal(nodePages.nodesCounter, 1);
    st.deepEqual(nodePages.nodePages[0].nodes[0], {
      ...newNodeStub,
      index: 0
    });
    st.end();
  });

  t.test('Push method should return the index of the new node', async (st) => {
    const nodePages = new NodePages(() => {}, 64);
    nodePages.push(newNodeStub);
    const newNodeIndex = nodePages.push(newNodeStub);
    st.equal(newNodeIndex, 1);
    st.end();
  });

  t.test(
    'Push method should create new nodePage when "last nodePage.length" === "nodesPerPage"',
    async (st) => {
      const nodePages = new NodePages(() => {}, 64);
      for (let i = 0; i <= 65; i++) {
        nodePages.push(newNodeStub);
      }
      st.equal(nodePages.nodePages.length, 2);
      st.equal(nodePages.nodePages[1].nodes.length, 2);
      st.end();
    }
  );

  t.test('Should consume "nodesPerPage" in constructor', async (st) => {
    const nodePages = new NodePages(() => {}, 16);
    for (let i = 0; i <= 65; i++) {
      nodePages.push(newNodeStub);
    }
    st.equal(nodePages.nodePages.length, 5);
    st.equal(nodePages.nodePages[4].nodes.length, 2);
    st.end();
  });

  t.test('Push method should add children relation into the parent node', async (st) => {
    const nodePages = new NodePages(() => {}, 64);
    for (let i = 0; i <= 65; i++) {
      nodePages.push(newNodeStub);
    }
    nodePages.push(newNodeStub, 3);
    st.ok(nodePages.nodePages[0].nodes[3].children.includes(66));
    st.end();
  });

  t.test(
    'Push method should set "resource" property in the "mesh" equal to the new node index',
    async (st) => {
      const newNodeWithMesh = {
        ...newNodeStub,
        mesh: {
          geometry: {
            definition: 0
          }
        }
      };
      const nodePages = new NodePages(() => {}, 64);
      nodePages.push(newNodeWithMesh);
      const {material: material0, geometry: geometry0} = getMaterialAndGeometryFromNode(
        nodePages,
        0
      );
      st.equal(geometry0.resource, 0);
      st.deepEqual(material0, {});
      nodePages.push(newNodeWithMesh);
      const {material: material1, geometry: geometry1} = getMaterialAndGeometryFromNode(
        nodePages,
        1
      );
      st.equal(geometry1.resource, 1);
      st.deepEqual(material1, {});
      st.end();
    }
  );

  t.test(
    'Update material method should set "material" object in the "mesh" with node index and material id',
    async (st) => {
      const newNodeWithMesh = {
        ...newNodeStub,
        mesh: {
          geometry: {
            definition: 0
          }
        }
      };
      const nodePages = new NodePages(() => {}, 64);
      nodePages.updateMaterialByNodeId(nodePages.push(newNodeWithMesh), 0);
      const {material: material0} = getMaterialAndGeometryFromNode(nodePages, 0);
      st.equal(material0.resource, 0);
      st.equal(material0.definition, 0);
      nodePages.updateMaterialByNodeId(nodePages.push(newNodeWithMesh), 3);
      const {material: material1} = getMaterialAndGeometryFromNode(nodePages, 1);
      st.equal(material1.resource, 1);
      st.equal(material1.definition, 3);
      st.end();
    }
  );

  t.test('Should save node pages', async (st) => {
    const savedNodePages = [];
    const writeFileFunc = (layerPath, data, slpk) => {
      savedNodePages.push(data);
    };
    const nodePages = new NodePages(writeFileFunc, 64);
    for (let i = 0; i <= 65; i++) {
      nodePages.push(newNodeStub);
    }
    await nodePages.save('/layer/0', {}, false);
    st.equal(typeof savedNodePages[1], 'string');
    st.equal(savedNodePages.length, 2);
    st.end();
  });

  t.test('Should save node pages for slpk packaging', async (st) => {
    const savedNodePages = [];
    const writeFileFuncForSlpk = (layerPath, data, slpk) => {
      savedNodePages.push(data);
    };
    const nodePages = new NodePages(writeFileFuncForSlpk, 64);
    for (let i = 0; i <= 65; i++) {
      nodePages.push(newNodeStub);
    }
    await nodePages.save('/layer/0', {}, true);
    st.equal(typeof savedNodePages[1], 'string');
    st.equal(savedNodePages.length, 3);
    st.end();
  });

  t.end();
});
