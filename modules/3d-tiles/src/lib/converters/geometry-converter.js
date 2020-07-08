import {Vector3, Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

const VALUES_PER_VERTEX = 3;
const VALUES_PER_TEX_COORD = 2;
const VALUES_PER_COLOR_ELEMENT = 4;
export default function convertB3dmToI3sGeometry(content) {
  const {positions, normals, texCoords, colors} = convertAttributes(content);

  const vertexCount = positions.length / VALUES_PER_VERTEX;
  const header = new Uint32Array(2);
  header.set([vertexCount], 0);

  let fileBuffer = header.buffer;
  fileBuffer = concatenateArrayBuffers(fileBuffer, positions.buffer);
  fileBuffer = concatenateArrayBuffers(fileBuffer, normals.buffer);
  fileBuffer = concatenateArrayBuffers(fileBuffer, texCoords.buffer);
  fileBuffer = concatenateArrayBuffers(fileBuffer, colors.buffer);
  return {geometry: fileBuffer, textures: getTexture(content)};
}

function convertAttributes(content) {
  let positions = new Float32Array(0);
  let normals = new Float32Array(0);
  let convertedTexCoords = new Float32Array(0);
  const nodes = content.gltf.scene.nodes;
  const convertedAttributes = convertNodes(nodes, content, {
    positions,
    normals,
    texCoords: convertedTexCoords
  });
  positions = convertedAttributes.positions;
  normals = convertedAttributes.normals;
  convertedTexCoords = convertedAttributes.texCoords;
  const vertexCount = positions.length / VALUES_PER_VERTEX;
  const colors = new Uint8Array(vertexCount * VALUES_PER_COLOR_ELEMENT);
  for (let index = 0; index < colors.length; index += 4) {
    // TODO: to implement colors support (if applicable for gltf format)
    colors.set([255, 255, 255, 255], index);
  }

  let texCoords = convertedTexCoords;
  if (!texCoords.length) {
    texCoords = new Float32Array(vertexCount * VALUES_PER_TEX_COORD);
    for (let index = 0; index < texCoords.length; index += 2) {
      texCoords.set([1, 1], index);
    }
  }

  return {
    positions,
    normals,
    colors,
    texCoords
  };
}

function convertNodes(
  nodes,
  content,
  {positions, normals, texCoords},
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  if (nodes) {
    for (const node of nodes) {
      const newAttributes = convertNode(node, content, {positions, normals, texCoords}, matrix);
      positions = newAttributes.positions;
      normals = newAttributes.normals;
      texCoords = newAttributes.texCoords;
    }
  }
  return {positions, normals, texCoords};
}

function convertNode(
  node,
  content,
  {positions, normals, texCoords},
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  const mesh = node.mesh;
  const nodeMatrix = node.matrix;
  const compositeMatrix = nodeMatrix ? matrix.multiplyRight(nodeMatrix) : matrix;
  if (mesh) {
    for (const primitive of mesh.primitives) {
      const attributes = primitive.attributes;
      const batchIds = content.batchTableJson && content.batchTableJson.id;
      if (!(batchIds && batchIds.length) || !isBatchedIndices(primitive.indices, attributes)) {
        // TODO: optimize arrays concatenation
        positions = concatenateTypedArrays(
          positions,
          transformVertexArray(
            attributes.POSITION.value,
            content.cartographicOrigin,
            content.cartesianModelMatrix,
            compositeMatrix,
            primitive.indices.value
          )
        );
        normals = concatenateTypedArrays(
          normals,
          transformVertexArray(
            attributes.NORMAL && attributes.NORMAL.value,
            content.cartographicOrigin,
            content.cartesianModelMatrix,
            compositeMatrix,
            primitive.indices.value
          )
        );
        texCoords = concatenateTypedArrays(
          texCoords,
          flattenTexCoords(
            attributes.TEXCOORD_0 && attributes.TEXCOORD_0.value,
            primitive.indices.value
          )
        );
        continue; // eslint-disable-line
      }
      for (const batchId of batchIds) {
        const {
          positions: newPositions,
          normals: newNormals,
          texCoords: newTexCoords
        } = getValuesByBatchId(attributes, batchId);
        positions = concatenateTypedArrays(
          positions,
          transformVertexArray(
            newPositions,
            content.cartographicOrigin,
            content.cartesianModelMatrix,
            compositeMatrix,
            primitive.indices.value
          )
        );

        normals = concatenateTypedArrays(
          normals,
          transformVertexArray(
            newNormals,
            content.cartographicOrigin,
            content.cartesianModelMatrix,
            nodeMatrix,
            primitive.indices.value
          )
        );

        texCoords = concatenateTypedArrays(
          texCoords,
          flattenTexCoords(newTexCoords, primitive.indices.value)
        );
      }
    }
  }
  const newAttributes = convertNodes(
    node.children,
    content,
    {positions, normals, texCoords},
    compositeMatrix
  );
  positions = newAttributes.positions;
  normals = newAttributes.normals;
  texCoords = newAttributes.texCoords;
  return {positions, normals, texCoords};
}

function concatenateTypedArrays(array1, array2) {
  const newArray = new Float32Array(array1.length + array2.length);
  newArray.set(array1);
  newArray.set(array2, array1.length);
  return newArray;
}

function concatenateArrayBuffers(source1, source2) {
  const sourceArray1 = source1 instanceof ArrayBuffer ? new Uint8Array(source1) : source1;
  const sourceArray2 = source2 instanceof ArrayBuffer ? new Uint8Array(source2) : source2;
  const temp = new Uint8Array(sourceArray1.byteLength + sourceArray2.byteLength);
  temp.set(sourceArray1, 0);
  temp.set(sourceArray2, sourceArray1.byteLength);
  return temp;
}

function isBatchedIndices(indices, attributes) {
  const {positions} = getValuesByBatchId(attributes, 0);
  return indices.max < positions.length;
}

function transformVertexArray(
  vertices,
  cartographicOrigin,
  cartesianModelMatrix,
  nodeMatrix,
  indices
) {
  const newVertices = new Float32Array(indices.length * VALUES_PER_VERTEX);
  if (!vertices) {
    return newVertices;
  }
  for (let i = 0; i < indices.length; i++) {
    const coordIndex = indices[i] * VALUES_PER_VERTEX;
    const vertex = vertices.subarray(coordIndex, coordIndex + VALUES_PER_VERTEX);
    let vertexVector = new Vector3(vertex);

    if (nodeMatrix) {
      vertexVector = vertexVector.transform(nodeMatrix);
    }

    vertexVector = vertexVector.transform(cartesianModelMatrix);
    Ellipsoid.WGS84.cartesianToCartographic(
      [vertexVector[0], vertexVector[1], vertexVector[2]],
      vertexVector
    );
    vertexVector = vertexVector.subtract(cartographicOrigin);

    newVertices[i * VALUES_PER_VERTEX] = vertexVector.x;
    newVertices[i * VALUES_PER_VERTEX + 1] = vertexVector.y;
    newVertices[i * VALUES_PER_VERTEX + 2] = vertexVector.z;
  }
  return newVertices;
}

function flattenTexCoords(texCoords, indices) {
  if (!texCoords) {
    return new Float32Array(0);
  }
  const newTexCoords = new Float32Array(indices.length * VALUES_PER_TEX_COORD);
  for (let i = 0; i < indices.length; i++) {
    const coordIndex = indices[i] * VALUES_PER_TEX_COORD;
    const texCoord = texCoords.subarray(coordIndex, coordIndex + VALUES_PER_TEX_COORD);
    newTexCoords[i * VALUES_PER_TEX_COORD] = texCoord[0];
    newTexCoords[i * VALUES_PER_TEX_COORD + 1] = texCoord[1];
    newTexCoords[i * VALUES_PER_TEX_COORD + 2] = texCoord[2];
  }
  return newTexCoords;
}

/* eslint-disable max-statements */
function getValuesByBatchId(attributes, batchId) {
  const batchIdAttribute = attributes._BATCHID;
  const positionsToBatch = attributes.POSITION.value;
  const normalsToBatch = attributes.NORMAL.value;
  const texCoordsToBatch = attributes.TEXCOORD_0 && attributes.TEXCOORD_0.value;
  if (!batchIdAttribute) {
    return {
      positions: positionsToBatch,
      normals: normalsToBatch,
      texCoords: texCoordsToBatch
    };
  }
  const batchIdRelations = batchIdAttribute.value;
  const batchIdCount = batchIdRelations.filter(id => id === batchId).length;
  const positions = new Float32Array(batchIdCount * VALUES_PER_VERTEX);
  const normals = new Float32Array(batchIdCount * VALUES_PER_VERTEX);
  let texCoords = null;
  if (texCoordsToBatch) {
    texCoords = new Float32Array(batchIdCount * VALUES_PER_TEX_COORD);
  }
  let resultArrayCounter = 0;
  let texCoordsArrayCounter = 0;
  for (let index = 0; index < batchIdAttribute.count; index++) {
    if (batchIdRelations[index] === batchId) {
      positions[resultArrayCounter] = positionsToBatch[index * VALUES_PER_VERTEX];
      positions[resultArrayCounter + 1] = positionsToBatch[index * VALUES_PER_VERTEX + 1];
      positions[resultArrayCounter + 2] = positionsToBatch[index * VALUES_PER_VERTEX + 2];
      normals[resultArrayCounter] = normalsToBatch[index * VALUES_PER_VERTEX];
      normals[resultArrayCounter + 1] = normalsToBatch[index * VALUES_PER_VERTEX + 1];
      normals[resultArrayCounter + 2] = normalsToBatch[index * VALUES_PER_VERTEX + 2];
      resultArrayCounter += VALUES_PER_VERTEX;

      if (texCoords) {
        texCoords[texCoordsArrayCounter] = texCoordsToBatch[index * VALUES_PER_VERTEX];
        texCoords[texCoordsArrayCounter + 1] = texCoordsToBatch[index * VALUES_PER_VERTEX + 1];
        texCoordsArrayCounter += VALUES_PER_TEX_COORD;
      }
    }
  }
  return {
    positions,
    normals,
    texCoords
  };
}
/* eslint-enable max-statements */

function getTexture(content) {
  const images = content.gltf.images;
  // TODO: handle multiple images inside one gltf
  // TODO: handle external images
  return images && images.length && images[0];
}
