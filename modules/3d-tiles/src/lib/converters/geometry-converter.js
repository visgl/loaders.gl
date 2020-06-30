// import {promises as fs} from 'fs';
import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

const VALUES_PER_VERTEX = 3;
// export default async function convertToI3s(filePath, content) {
export default function convertB3dmToI3sGeometry(content) {
  const {positions, normals, texCoords, colors} = convertAttributes(content);

  const vertexCount = positions.length / VALUES_PER_VERTEX;
  const header = new Uint32Array(new ArrayBuffer(2 * Uint32Array.BYTES_PER_ELEMENT));
  header.set([vertexCount], 0);

  let fileBuffer = header.buffer;
  fileBuffer = concatenateArrayBuffers(
    fileBuffer,
    positions.buffer.slice(positions.byteOffset, positions.byteOffset + positions.byteLength)
  );
  fileBuffer = concatenateArrayBuffers(
    fileBuffer,
    normals.buffer.slice(normals.byteOffset, normals.byteOffset + normals.byteLength)
  );
  fileBuffer = concatenateArrayBuffers(fileBuffer, texCoords.buffer);
  fileBuffer = concatenateArrayBuffers(fileBuffer, colors.buffer);
  return fileBuffer;
}

function convertAttributes(content) {
  const {positions, normals} = convertPositionsAndNormals(content);
  const vertexCount = positions.length / 3;
  const VALUES_PER_COLOR_ELEMENT = 4;
  const colors = new Uint8Array(new ArrayBuffer(vertexCount * VALUES_PER_COLOR_ELEMENT));
  for (let index = 0; index < colors.length; index++) {
    colors.set([255], index);
  }

  const VALUES_PER_TEX_COORD_ELEMENT = 2;
  const texCoords = new Float32Array(
    new ArrayBuffer(vertexCount * VALUES_PER_TEX_COORD_ELEMENT * Float32Array.BYTES_PER_ELEMENT)
  );
  for (let index = 0; index < texCoords.length; index += 2) {
    texCoords.set([0.9846158027648926, 0.1158415824174881], index);
  }
  return {
    positions,
    normals,
    colors,
    texCoords
  };
}

function convertPositionsAndNormals(content) {
  const nodes = content.gltf.nodes;
  let positions = new Float32Array(0);
  let normals = new Float32Array(0);
  for (const node of nodes) {
    const mesh = node.mesh;
    const nodeMatrix = node.matrix;
    for (const primitive of mesh.primitives) {
      const attributes = primitive.attributes;
      let batchIds = content.batchTableJson && content.batchTableJson.id;
      if (!(batchIds && batchIds.length)) {
        batchIds = [0];
      }
      for (const batchId of batchIds) {
        const {positions: newPositions, normals: newNormals} = getValuesByBatchId(
          attributes,
          batchId
        );
        positions = concatenateTypedArrays(
          positions,
          normalizePositions(
            newPositions,
            content.cartographicOrigin,
            content.cartesianModelMatrix,
            nodeMatrix,
            primitive.indices.value
          )
        );

        normals = concatenateTypedArrays(
          normals,
          normalizeNormals(newNormals, primitive.indices.value)
        );
      }
    }
  }
  return {
    positions,
    normals
  };
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

function normalizePositions(
  vertices,
  cartographicOrigin,
  cartesianModelMatrix,
  nodeMatrix,
  indices
) {
  const positions = new Float32Array(indices.length * VALUES_PER_VERTEX);
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

    positions[i * VALUES_PER_VERTEX] = vertexVector.x;
    positions[i * VALUES_PER_VERTEX + 1] = vertexVector.y;
    positions[i * VALUES_PER_VERTEX + 2] = vertexVector.z;
  }
  return positions;
}

function normalizeNormals(normals, indices) {
  const newNormals = new Float32Array(indices.length * VALUES_PER_VERTEX);
  for (let i = 0; i < indices.length; i++) {
    const coordIndex = indices[i] * VALUES_PER_VERTEX;
    const normal = normals.subarray(coordIndex, coordIndex + VALUES_PER_VERTEX);
    newNormals[i * VALUES_PER_VERTEX] = normal[0];
    newNormals[i * VALUES_PER_VERTEX + 1] = normal[1];
    newNormals[i * VALUES_PER_VERTEX + 2] = normal[2];
  }
  return newNormals;
}

function getValuesByBatchId(attributes, batchId) {
  const batchIdAttribute = attributes._BATCHID;
  const positionsToBatch = attributes.POSITION.value;
  const normalsToBatch = attributes.NORMAL.value;
  if (!batchIdAttribute) {
    return {
      positions: positionsToBatch,
      normals: normalsToBatch
    };
  }
  const batchIdRelations = batchIdAttribute.value;
  const batchIdCount = batchIdRelations.filter(id => id === batchId).length;
  const positions = new Float32Array(batchIdCount * VALUES_PER_VERTEX);
  const normals = new Float32Array(batchIdCount * VALUES_PER_VERTEX);
  let resultArrayCounter = 0;
  for (let index = 0; index < batchIdAttribute.count; index++) {
    if (batchIdRelations[index] === batchId) {
      positions[resultArrayCounter] = positionsToBatch[index * VALUES_PER_VERTEX];
      positions[resultArrayCounter + 1] = positionsToBatch[index * VALUES_PER_VERTEX + 1];
      positions[resultArrayCounter + 2] = positionsToBatch[index * VALUES_PER_VERTEX + 2];
      normals[resultArrayCounter] = normalsToBatch[index * VALUES_PER_VERTEX];
      normals[resultArrayCounter + 1] = normalsToBatch[index * VALUES_PER_VERTEX + 1];
      normals[resultArrayCounter + 2] = normalsToBatch[index * VALUES_PER_VERTEX + 2];
      resultArrayCounter += VALUES_PER_VERTEX;
    }
  }
  return {
    positions,
    normals
  };
}
