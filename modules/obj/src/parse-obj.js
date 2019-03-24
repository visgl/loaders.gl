import {Mesh} from 'webgl-obj-loader';

export default function parseOBJ(text) {
  const mesh = new Mesh(text);

  const data = {
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
    attributes: getNormalizedAttributes(mesh)
  };

  if (mesh.indices) {
    data.indices = {
      value: new Uint32Array(mesh.indices),
      size: 1
    };
  }

  return data;
}

function getNormalizedAttributes(mesh) {
  const accessors = {};
  accessors.POSITION = {value: new Float32Array(mesh.vertices), size: 3};
  if (mesh.vertexNormals.length && !isNaN(mesh.vertexNormals[0])) {
    accessors.NORMAL = {value: new Float32Array(mesh.vertexNormals), size: 3};
  }
  if (mesh.textures.length) {
    accessors.TEXCOORD_0 = {value: new Float32Array(mesh.textures), size: 2};
  }
  return accessors;
}
