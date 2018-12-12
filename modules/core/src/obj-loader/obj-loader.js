import {Mesh} from 'webgl-obj-loader';
import {getGLTFAccessors, getGLTFIndices, getGLTFAttributeMap}
  from '../common/mesh-utils/gltf-attribute-utils';

function testOBJFile(text) {
  // There could be comment line first
  return text[0] === 'v';
}

function parseOBJMesh(text) {
  const mesh = new Mesh(text);

  const indices = getGLTFIndices(mesh);

  const accessors = {
    positions: {value: new Float32Array(mesh.vertices), size: 3}
  };
  if (mesh.vertexNormals.length && mesh.vertexNormals[0] !== NaN) {
    accessors.normals = {value: new Float32Array(mesh.vertexNormals), size: 3};
  }
  if (mesh.textures.length) {
    accessors.texCoords = mesh.textures.length && {value: new Float32Array(mesh.textures), size: 2};
  }

  const attributes = getGLTFAccessors(accessors);

  const glTFAttributeMap = getGLTFAttributeMap(attributes);

  return {
    // Data return by this loader implementation
    loaderData: {
      header: {}
    },
    // Normalised data
    header: {
      indexCount: mesh.indices && mesh.indices.length,
      vertexCount: mesh.vertices.length / 3,
      primitiveCount: mesh.indices && mesh.indices.length / 3
    },
    mode: 4, // TRIANGLES
    indices,
    attributes,
    glTFAttributeMap
  };
}

export default {
  name: 'OBJ',
  extension: 'obj',
  testText: testOBJFile,
  parseText: parseOBJMesh
};
