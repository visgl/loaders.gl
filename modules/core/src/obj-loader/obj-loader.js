import OBJ from 'webgl-obj-loader';
import {getGLTFAttributes, getGLTFIndices} from '../common/mesh-utils/gltf-type-utils';

function testOBJFile(text) {
  // There could be comment line first
  return text[0] === 'v';
}

function parseOBJMesh(text) {
  const mesh = new OBJ.Mesh(text);

  const indices = getGLTFIndices(mesh);

  const attributes = getGLTFAttributes({
    POSITION: new Float32Array(mesh.vertices),
    NORMAL: new Float32Array(mesh.vertexNormals),
    TEXCOORD_0: new Float32Array(mesh.textures)
  });

  return {
    // Data return by this loader implementation
    loaderData: {
      header: {},
      attributes: mesh
    },
    // Normalised data
    header: {
      indexCount: mesh.indices && mesh.indices.length,
      vertexCount: mesh.vertices.length / 3,
      primitiveCount: mesh.indices && mesh.indices.length / 3
    },
    mode: 4, // TRIANGLES
    indices,
    attributes
  };
}

export default {
  name: 'OBJ',
  extension: 'obj',
  testText: testOBJFile,
  parseText: parseOBJMesh
};
