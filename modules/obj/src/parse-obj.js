import {Mesh} from 'webgl-obj-loader';
import {getGLTFAccessors, getGLTFIndices, getGLTFAttributeMap} from '@loaders.gl/core';

export default function parseOBJ(text) {
  const mesh = new Mesh(text);

  const indices = getGLTFIndices(mesh);

  const accessors = {
    positions: {value: new Float32Array(mesh.vertices), size: 3}
  };
  if (mesh.vertexNormals.length && !isNaN(mesh.vertexNormals[0])) {
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
