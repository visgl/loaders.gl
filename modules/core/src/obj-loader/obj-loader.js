import OBJ from 'webgl-obj-loader';

function testOBJFile(text) {
  // There could be comment line first
  return text[0] === 'v';
}

function parseOBJMesh(text) {
  const mesh = new OBJ.Mesh(text);

  return {
    originalHeader: {},
    originalAttributes: mesh,

    header: {
      vertexCount: mesh.vertices.length / 3,
      primitiveCount: mesh.indices && mesh.indices.length / 3
    },
    mode: 4, // TRIANGLES
    indices: new Uint16Array(mesh.indices),
    attributes: {
      POSITION: new Float32Array(mesh.vertices),
      NORMAL: new Float32Array(mesh.vertexNormals),
      TEXCOORD_0: new Float32Array(mesh.textures)
    }
  };
}

export default {
  name: 'OBJ',
  extension: 'obj',
  testText: testOBJFile,
  parseText: parseOBJMesh
};
