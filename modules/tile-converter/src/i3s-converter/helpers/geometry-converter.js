/* global BigInt, BigUint64Array, Buffer */

import {Vector3, Matrix4, Vector4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';
import {concatenateArrayBuffers, concatenateTypedArrays} from '@loaders.gl/loader-utils';
import md5 from 'md5';
import {generateAttributes} from './geometry-attributes';

const VALUES_PER_VERTEX = 3;
const VALUES_PER_TEX_COORD = 2;
const VALUES_PER_COLOR_ELEMENT = 4;

const STRING_TYPE = 'string';
const SHORT_INT_TYPE = 'Int32';
const DOUBLE_TYPE = 'Float64';
const OBJECT_ID_TYPE = 'Oid32';
/*
* 'CUSTOM_ATTRIBUTE_2' - Attribute name which includes batch info and used by New York map.
* _BATCHID - default attribute name which includes batch info.
*/
const BATCHED_ID_POSSIBLE_ATTRIBUTE_NAMES = ['CUSTOM_ATTRIBUTE_2', '_BATCHID'];

export default async function convertB3dmToI3sGeometry(
  tileContent,
  nodeId,
  featuresHashArray,
  attributeStorageInfo,
  draco
) {
  const convertedAttributes = convertAttributes(tileContent);
  const {material, texture} = convertMaterial(tileContent);
  const vertexCount = convertedAttributes.positions.length / VALUES_PER_VERTEX;
  const triangleCount = vertexCount / 3;
  const {
    faceRange,
    featureIds,
    positions,
    normals,
    colors,
    texCoords,
    featureCount
  } = generateAttributes({triangleCount, ...convertedAttributes});

  if (tileContent.batchTableJson) {
    makeFeatureIdsUnique(
      featureIds,
      convertedAttributes.featureIndices,
      featuresHashArray,
      tileContent.batchTableJson
    );
  }

  const header = new Uint32Array(2);
  const typedFeatureIds = generateBigUint64Array(featureIds);

  header.set([vertexCount, featureCount], 0);
  const fileBuffer = new Uint8Array(
    concatenateArrayBuffers(
      header.buffer,
      positions.buffer,
      normals.buffer,
      texCoords.buffer,
      colors.buffer,
      typedFeatureIds.buffer,
      faceRange.buffer
    )
  );
  const compressedGeometry = draco
    ? await generateCompressedGeometry(vertexCount, convertedAttributes, {
        positions,
        normals,
        texCoords,
        colors,
        featureIds,
        faceRange
      })
    : null;

  const attributes = convertBatchTableToAttributeBuffers(
    tileContent.batchTableJson,
    featureIds,
    attributeStorageInfo
  );

  return {
    geometry: fileBuffer,
    compressedGeometry,
    texture,
    sharedResources: getSharedResources(tileContent, nodeId),
    meshMaterial: material,
    vertexCount,
    attributes,
    featureCount
  };
}

/**
 * Convert attributes from the gltf nodes tree to i3s plain geometry
 * @param {Object} tileContent - 3d tile content
 * @returns {Object}
 * {
 *   positions: Float32Array,
 *   normals: Float32Array,
 *   colors: Uint8Array,
 *   texCoords: Float32Array
 * }
 * @todo implement colors support (if applicable for gltf format)
 */
function convertAttributes(tileContent) {
  let positions = new Float32Array(0);
  let normals = new Float32Array(0);
  let convertedTexCoords = new Float32Array(0);
  let featureIndices = [];

  const nodes = tileContent.gltf.scene.nodes;
  const convertedAttributes = convertNodes(nodes, tileContent, {
    positions,
    normals,
    texCoords: convertedTexCoords,
    featureIndices
  });
  positions = convertedAttributes.positions;
  normals = convertedAttributes.normals;
  convertedTexCoords = convertedAttributes.texCoords;
  featureIndices = convertedAttributes.featureIndices;
  const vertexCount = positions.length / VALUES_PER_VERTEX;
  const colors = new Uint8Array(vertexCount * VALUES_PER_COLOR_ELEMENT);
  for (let index = 0; index < colors.length; index += 4) {
    colors.set([255, 255, 255, 255], index);
  }

  let texCoords = convertedTexCoords;
  if (!texCoords.length) {
    texCoords = new Float32Array(vertexCount * VALUES_PER_TEX_COORD);
    for (let index = 0; index < texCoords.length; index += 2) {
      texCoords.set([1, 1], index);
    }
  }

  featureIndices = featureIndices.reduce((acc, value) => acc.concat(value));

  return {
    positions,
    normals,
    colors,
    texCoords,
    featureIndices
  };
}

/**
 * Gltf has hierarchical structure of nodes. This function converts nodes starting from those which are in gltf scene object.
 *   The goal is applying tranformation matrix for all children. Functions "convertNodes" and "convertNode" work together recursively.
 * @param {Object[]} nodes - gltf nodes array
 * @param {Object} tileContent - 3d tile content
 * @param {Object} attributes {positions: Float32Array, normals: Float32Array, texCoords: Float32Array} - for recursive concatenation of
 *   attributes
 * @param {Matrix4} matrix - transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @returns {Object}
 * {
 *   positions: Float32Array,
 *   normals: Float32Array,
 *   texCoords: Float32Array
 * }
 */
function convertNodes(
  nodes,
  tileContent,
  {positions, normals, texCoords, featureIndices},
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  if (nodes) {
    for (const node of nodes) {
      const newAttributes = convertNode(
        node,
        tileContent,
        {positions, normals, texCoords, featureIndices},
        matrix
      );
      positions = newAttributes.positions;
      normals = newAttributes.normals;
      texCoords = newAttributes.texCoords;
      featureIndices = newAttributes.featureIndices;
    }
  }
  return {positions, normals, texCoords, featureIndices};
}

/**
 * Convert all primitives of node and all children nodes
 * @param {Object} node - gltf node
 * @param {Object} tileContent - 3d tile content
 * @param {Object} attributes {positions: Float32Array, normals: Float32Array, texCoords: Float32Array} - for recursive concatenation of
 *   attributes
 * @param {Matrix4} matrix - transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @returns {Object}
 * {
 *   positions: Float32Array,
 *   normals: Float32Array,
 *   texCoords: Float32Array
 * }
 * @todo: optimize arrays concatenation
 */
function convertNode(
  node,
  tileContent,
  {positions, normals, texCoords, featureIndices},
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  const nodeMatrix = node.matrix;
  const compositeMatrix = nodeMatrix ? matrix.multiplyRight(nodeMatrix) : matrix;

  const mesh = node.mesh;
  if (mesh) {
    const newAttributes = convertMesh(
      mesh,
      tileContent,
      {positions, normals, texCoords, featureIndices},
      compositeMatrix
    );
    positions = newAttributes.positions;
    normals = newAttributes.normals;
    texCoords = newAttributes.texCoords;
    featureIndices = newAttributes.featureIndices;
  }

  const newAttributes = convertNodes(
    node.children,
    tileContent,
    {positions, normals, texCoords, featureIndices},
    compositeMatrix
  );
  positions = newAttributes.positions;
  normals = newAttributes.normals;
  texCoords = newAttributes.texCoords;
  featureIndices = newAttributes.featureIndices;

  return {positions, normals, texCoords, featureIndices};
}

/**
 * Convert all primitives of node and all children nodes
 * @param {Object} mesh - gltf node
 * @param {Object} content - 3d tile content
 * @param {Object} attributes {positions: Float32Array, normals: Float32Array, texCoords: Float32Array} - for recursive concatenation of
 *   attributes
 * @param {Matrix4} matrix - transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @returns {Object}
 * {
 *   positions: Float32Array,
 *   normals: Float32Array,
 *   texCoords: Float32Array
 * }
 * @todo: optimize arrays concatenation
 */
function convertMesh(
  mesh,
  content,
  {positions, normals, texCoords, featureIndices},
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  for (const primitive of mesh.primitives) {
    normalizeAttributesByIndicesRange(primitive.attributes, primitive.indices);
    const attributes = primitive.attributes;

    positions = concatenateTypedArrays(
      positions,
      transformVertexArray(
        attributes.POSITION.value,
        content.cartographicOrigin,
        content.cartesianModelMatrix,
        matrix,
        primitive.indices.value
      )
    );
    normals = concatenateTypedArrays(
      normals,
      transformVertexArray(
        attributes.NORMAL && attributes.NORMAL.value,
        content.cartographicOrigin,
        content.cartesianModelMatrix,
        matrix,
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

    featureIndices.push(
      flattenBatchIds(getBatchIdsByAttributeName(attributes), primitive.indices.value)
    );
  }

  return {positions, normals, texCoords, featureIndices};
}

/**
 * Do normalisation of arrtibutes based on indices range.
 * @param {Object} indices - gltf primitive indices array
 * @param {Object} attributes - gltf primitive attributes
 * @returns {void}
 */
function normalizeAttributesByIndicesRange(indices, attributes) {
  if (!indices || !indices.min || !indices.max) {
    return;
  }

  const maxIndex = indices.max[0];
  const minIndex = indices.min[0];

  for (const key in attributes) {
    const attribute = attributes[key];
    attribute.value = attribute.value.subarray(
      minIndex * attribute.size,
      maxIndex * attribute.size
    );
    attribute.count = maxIndex - minIndex;
  }
}
/**
 * Convert vertices attributes (POSITIONS or NORMALS) to i3s compatible format
 * @param {Float32Array} vertices - gltf primitive POSITION or NORMAL attribute
 * @param {Object} cartographicOrigin - cartographic origin coordinates
 * @param {Object} cartesianModelMatrix - a cartesian model matrix to transform coordnates from cartesian to cartographic format
 * @param {Matrix4} nodeMatrix - a gltf node transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @param {Uint8Array} indices - gltf primitive indices
 * @returns {Float32Array}
 */
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
    let vertexVector = new Vector3(Array.from(vertex));

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

/**
 * Convert uv0 (texture coordinates) from coords based on indices to plain arrays, compatible with i3s
 * @param {Float32Array} texCoords - gltf primitive TEXCOORD_0 attribute
 * @param {Uint8Array} indices - gltf primitive indices
 * @returns {Float32Array}
 */
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
  }
  return newTexCoords;
}
/**
 * Flatten batchedIds list based on indices to right ordered array, compatible with i3s
 * @param {Array} batchedIds - gltf primitive
 * @param {Uint8Array} indices - gltf primitive indices
 * @returns {Array}
 */
function flattenBatchIds(batchedIds, indices) {
  if (!batchedIds.length || !indices.length) {
    return [];
  }
  const newBatchIds = [];
  for (let i = 0; i < indices.length; i++) {
    const coordIndex = indices[i];
    newBatchIds.push(batchedIds[coordIndex]);
  }
  return newBatchIds;
}
/**
 * Return batchIds based on possible attribute names for different kind of maps.
 * @param {Object} attributes {attributeName: Float32Array}
 * @returns {Array}
 */
function getBatchIdsByAttributeName(attributes) {
  let batchIds = [];

  for (let index = 0; index < BATCHED_ID_POSSIBLE_ATTRIBUTE_NAMES.length; index++) {
    const possibleBatchIdAttributeName = BATCHED_ID_POSSIBLE_ATTRIBUTE_NAMES[index];
    if (
      attributes[possibleBatchIdAttributeName] &&
      attributes[possibleBatchIdAttributeName].value
    ) {
      batchIds = attributes[possibleBatchIdAttributeName].value;
      break;
    }
  }

  return batchIds;
}

/**
 * Convert texture and material from gltf material object
 * @param {Object} tileContent - 3d tile content
 * @returns {Object}
 */
function convertMaterial(tileContent) {
  const sourceMaterials = tileContent.gltf.materials;
  if (!sourceMaterials || !sourceMaterials.length) {
    return {};
  }
  if (sourceMaterials.length > 1) {
    // eslint-disable-next-line no-console, no-undef
    console.warn(
      `Warning: 3D tile contains multiple materials, only the first material was converted`
    );
  }
  const sourceMaterial = sourceMaterials[0];
  const sourceImages = tileContent.gltf.images;
  // Gltf 2.0
  if (sourceMaterial.pbrMetallicRoughness) {
    return convertMaterial20(sourceMaterial, sourceImages);
  }

  // Gltf 1.0
  return convertMaterial10(sourceImages);
}

/**
 * Convert texture and material from gltf 2.0 material object
 * @param {Object} sourceMaterial - material object
 * @param {Object[]} sourceImages - images array
 * @returns {Object}
 */
function convertMaterial20(sourceMaterial, sourceImages) {
  const material = {
    doubleSided: sourceMaterial.doubleSided,
    emissiveFactor: sourceMaterial.emissiveFactor.map(c => Math.round(c * 255)),
    // It is in upper case in GLTF: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#alpha-coverage
    // But it is in lower case in I3S: https://github.com/Esri/i3s-spec/blob/master/docs/1.7/materialDefinitions.cmn.md
    alphaMode: (sourceMaterial.alphaMode || 'OPAQUE').toLowerCase(),
    pbrMetallicRoughness: {
      roughnessFactor: sourceMaterial.pbrMetallicRoughness.roughnessFactor,
      metallicFactor: sourceMaterial.pbrMetallicRoughness.metallicFactor
    }
  };

  let texture;
  if (sourceMaterial.pbrMetallicRoughness.baseColorTexture) {
    texture = sourceMaterial.pbrMetallicRoughness.baseColorTexture.texture.source;
  } else if (sourceImages && sourceImages.length) {
    texture = sourceImages[0];
  }
  if (texture) {
    material.pbrMetallicRoughness.baseColorTexture = {
      textureSetDefinitionId: 0
    };
  } else {
    // Should use default baseColorFactor if it is not present in source material
    // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#reference-pbrmetallicroughness
    const defaultBaseColorFactor = [1, 1, 1, 1];
    const baseColorFactor =
      sourceMaterial.pbrMetallicRoughness.baseColorFactor || defaultBaseColorFactor;
    material.pbrMetallicRoughness.baseColorFactor = baseColorFactor.map(c => Math.round(c * 255));
  }
  return {material, texture};
}

/**
 * Convert texture and material from gltf 1.0 material object
 * @param {Object[]} sourceImages - images array
 * @returns {Object}
 */
function convertMaterial10(sourceImages) {
  const material = {
    doubleSided: true,
    pbrMetallicRoughness: {
      baseColorTexture: {
        textureSetDefinitionId: 0
      },
      metallicFactor: 0
    }
  };
  let texture;
  if (sourceImages && sourceImages.length) {
    texture = sourceImages[0];
  }
  return {material, texture};
}

/**
 * Form "sharedResources" from gltf materials array
 * @param {Object} tileContent - 3d tile content
 * @returns {Object} {materialDefinitionInfos: Object[], textureDefinitionInfos: Object[]} -
 * 2 arrays in format of i3s sharedResources data https://github.com/Esri/i3s-spec/blob/master/docs/1.7/sharedResource.cmn.md
 */
function getSharedResources(tileContent, nodeId) {
  const gltfMaterials = tileContent.gltf.materials;
  const i3sResources = {};

  if (!gltfMaterials || !gltfMaterials.length) {
    return i3sResources;
  }

  i3sResources.materialDefinitionInfos = [];
  for (const gltfMaterial of gltfMaterials) {
    const {materialDefinitionInfo, textureDefinitionInfo} = convertGLTFMaterialToI3sSharedResources(
      gltfMaterial,
      nodeId
    );
    i3sResources.materialDefinitionInfos.push(materialDefinitionInfo);
    if (textureDefinitionInfo) {
      i3sResources.textureDefinitionInfos = i3sResources.textureDefinitionInfos || [];
      i3sResources.textureDefinitionInfos.push(textureDefinitionInfo);
    }
  }
  return i3sResources;
}

/**
 * Convert gltf material into I3S sharedResources data
 * @param {Object} gltfMaterial - gltf material data
 * @returns {Object} - Couple {materialDefinitionInfo, textureDefinitionInfo} extracted from gltf material data
 */
function convertGLTFMaterialToI3sSharedResources(gltfMaterial, nodeId) {
  const texture =
    gltfMaterial.pbrMetallicRoughness.baseColorTexture || gltfMaterial.emissiveTexture;
  let textureDefinitionInfo = null;
  if (texture) {
    textureDefinitionInfo = extractSharedResourcesTextureInfo(texture.texture, nodeId);
  }
  const {baseColorFactor, metallicFactor} = gltfMaterial.pbrMetallicRoughness;
  let colorFactor = baseColorFactor;
  // If alpha channel is 0 try to get emissive factor from gltf material.
  if ((!baseColorFactor || baseColorFactor[3] === 0) && gltfMaterial.emissiveFactor) {
    colorFactor = gltfMaterial.emissiveFactor;
    colorFactor[3] = colorFactor[3] || 1;
  }

  return {
    materialDefinitionInfo: extractSharedResourcesMaterialInfo(colorFactor, metallicFactor),
    textureDefinitionInfo
  };
}

/**
 * Form "materialDefinition" which is part of "sharedResouces"
 * https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#materials
 * See formulas in appendix "Appendix B: BRDF Implementation":
 * const dielectricSpecular = rgb(0.04, 0.04, 0.04)
 * const black = rgb(0, 0, 0)
 * cdiff = lerp(baseColor.rgb * (1 - dielectricSpecular.r), black, metallic)
 * F0 = lerp(dieletricSpecular, baseColor.rgb, metallic)
 *
 * Assumption: F0 - specular in i3s ("specular reflection" <-> "reflectance value at normal incidence")
 * cdiff - diffuse in i3s ("Diffuse color" <-> "'c' diffuse" (c means color?))
 * @param {number[]} baseColorFactor - RGBA color in 0..1 format
 * @param {number} metallicFactor - "metallicFactor" attribute of gltf material object
 * @returns {Object}
 */
function extractSharedResourcesMaterialInfo(baseColorFactor, metallicFactor = 0) {
  const matDielectricColorComponent = 0.04 / 255; // Color from rgb (255) to 0..1 resolution
  // All color resolutions are 0..1
  const black = new Vector4(0, 0, 0, 1);
  const unitVector = new Vector4(1, 1, 1, 1);
  const dielectricSpecular = new Vector4(
    matDielectricColorComponent,
    matDielectricColorComponent,
    matDielectricColorComponent,
    0
  );
  const baseColorVector = new Vector4(baseColorFactor);
  // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
  // Formulas for Cdiff & F0
  const firstOperand = unitVector.subtract(dielectricSpecular).multiply(baseColorVector);
  const diffuse = firstOperand.lerp(firstOperand, black, metallicFactor);
  dielectricSpecular[3] = 1;
  const specular = dielectricSpecular.lerp(dielectricSpecular, baseColorVector, metallicFactor);
  return {
    diffuse: diffuse.toArray(),
    specular: specular.toArray()
  };
}

/**
 * Form "textureDefinition" which is part of "sharedResouces"
 * @param {Object} texture - texture image info
 * @returns {Object}
 */
function extractSharedResourcesTextureInfo(texture, nodeId) {
  return {
    encoding: [texture.source.mimeType],
    images: [
      {
        // 'i3s' has just size which is width of the image. Images are supposed to be square.
        // https://github.com/Esri/i3s-spec/blob/master/docs/1.7/image.cmn.md
        id: generateImageId(texture, nodeId),
        size: texture.source.image.width,
        length: [texture.source.image.data.length]
      }
    ]
  };
}
/*
 * Formula for counting imageId:
 * https://github.com/Esri/i3s-spec/blob/0a6366a9249b831db8436c322f8d27521e86cf07/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md#generating-image-ids
 * @param {Object} texture - texture image info
 * @returns {string}
 */
function generateImageId(texture, nodeId) {
  const {width, height} = texture.source.image;
  const levelCountOfTexture = 1;
  const indexOfLevel = 0;
  const indexOfTextureInStore = nodeId + 1;

  const zerosCount = 32 - indexOfTextureInStore.toString(2).length;
  const rightHalf = '0'.repeat(zerosCount).concat(indexOfTextureInStore.toString(2));

  const shiftedLevelCountOfTexture = levelCountOfTexture << 28;
  const shiftedIndexOfLevel = indexOfLevel << 24;
  const shiftedWidth = (width - 1) << 12;
  const shiftedHeight = (height - 1) << 0;

  const leftHalf = shiftedLevelCountOfTexture + shiftedIndexOfLevel + shiftedWidth + shiftedHeight;
  const imageId = BigInt(`0b${leftHalf.toString(2)}${rightHalf}`);
  return imageId.toString();
}

/**
 * Make all feature ids unique through all nodes in layout.
 * @param {Array} featureIds
 * @param {Array} featureIndices
 * @param {Array} featuresHashArray
 * @param {Object} batchTable
 * @returns {void}
 */
function makeFeatureIdsUnique(featureIds, featureIndices, featuresHashArray, batchTable) {
  const replaceMap = getFeaturesReplaceMap(featureIds, batchTable, featuresHashArray);
  replaceIndicesByUnique(featureIndices, replaceMap);
  replaceIndicesByUnique(featureIds, replaceMap);
}

/**
 * Generate replace map to make featureIds unique.
 * @param {Array} featureIds
 * @param {Object} batchTable
 * @param {Array} featuresHashArray
 * @returns {Object}
 */
function getFeaturesReplaceMap(featureIds, batchTable, featuresHashArray) {
  const featureMap = {};

  for (let index = 0; index < featureIds.length; index++) {
    const oldFeatureId = featureIds[index];
    const uniqueFeatureId = getOrCreateUniqueFeatureId(index, batchTable, featuresHashArray);
    featureMap[oldFeatureId.toString()] = uniqueFeatureId;
  }

  return featureMap;
}

/**
 * Generates string for unique batch id creation.
 * @param {Object} batchTable
 * @param {Number} index
 * @returns {String}
 */
function generateStringFromBatchTableByIndex(batchTable, index) {
  let str = '';
  for (const key in batchTable) {
    str += batchTable[key][index];
  }
  return str;
}

/**
 * Return already exited featureId or creates and returns new to support unique feature ids throw nodes.
 * @param {Number} index
 * @param {Object} batchTable
 * @param {Array} featuresHashArray
 * @returns {Number}
 */
function getOrCreateUniqueFeatureId(index, batchTable, featuresHashArray) {
  const batchTableStr = generateStringFromBatchTableByIndex(batchTable, index);
  const hash = md5(batchTableStr);

  if (featuresHashArray.includes(hash)) {
    return featuresHashArray.indexOf(hash);
  }
  return featuresHashArray.push(hash) - 1;
}

/**
 * Do replacement of indices for making them unique through all nodes.
 * @param {Array} indicesArray
 * @param {Object} featureMap
 * @returns {void}
 */
function replaceIndicesByUnique(indicesArray, featureMap) {
  for (let index = 0; index < indicesArray.length; index++) {
    indicesArray[index] = featureMap[indicesArray[index]];
  }
}

/**
 * Convert batch table data to attribute buffers.
 * @param {Object} batchTable - table with metadata for particular feature.
 * @param {Array} featureIds
 * @param {Array} attributeStorageInfo
 * @returns {Array} - Array of file buffers.
 */
function convertBatchTableToAttributeBuffers(batchTable, featureIds, attributeStorageInfo) {
  const attributeBuffers = [];

  if (batchTable) {
    const batchTableWithFeatureIds = {
      OBJECTID: featureIds,
      ...batchTable
    };

    for (const key in batchTableWithFeatureIds) {
      const type = getAttributeType(key, attributeStorageInfo);

      let attributeBuffer = null;

      switch (type) {
        case OBJECT_ID_TYPE:
        case SHORT_INT_TYPE:
          attributeBuffer = generateShortIntegerAttributeBuffer(batchTableWithFeatureIds[key]);
          break;
        case DOUBLE_TYPE:
          attributeBuffer = generateDoubleAttributeBuffer(batchTableWithFeatureIds[key]);
          break;
        case STRING_TYPE:
          attributeBuffer = generateStringAttributeBuffer(batchTableWithFeatureIds[key]);
          break;
        default:
          attributeBuffer = generateStringAttributeBuffer(batchTableWithFeatureIds[key]);
      }

      attributeBuffers.push(attributeBuffer);
    }
  }

  return attributeBuffers;
}
/**
 * Return attribute type.
 * @param {String} key
 * @param {Array} attributeStorageInfo
 * @returns {String} attribute type.
 */
function getAttributeType(key, attributeStorageInfo) {
  const attribute = attributeStorageInfo.find(attr => attr.name === key);
  return attribute.attributeValues.valueType;
}

/**
 * Convert short integer to attribute arrayBuffer.
 * @param {Array} featureIds
 * @returns {ArrayBuffer} - Buffer with objectId data.
 */
function generateShortIntegerAttributeBuffer(featureIds) {
  const count = new Uint32Array([featureIds.length]);
  const valuesArray = new Uint32Array(featureIds);
  return concatenateArrayBuffers(count.buffer, valuesArray.buffer);
}

/**
 * Convert double to attribute arrayBuffer.
 * @param {Array} featureIds
 * @returns {ArrayBuffer} - Buffer with objectId data.
 */
function generateDoubleAttributeBuffer(featureIds) {
  const count = new Uint32Array([featureIds.length]);
  const padding = new Uint8Array(4);
  const valuesArray = new Float64Array(featureIds);

  return concatenateArrayBuffers(count.buffer, padding.buffer, valuesArray.buffer);
}

/**
 * Convert batch table attributes to array buffer with batch table data.
 * @param {Array} batchAttributes
 * @returns {ArrayBuffer} - Buffer with batch table data.
 */
function generateStringAttributeBuffer(batchAttributes) {
  const stringCountArray = new Uint32Array([batchAttributes.length]);
  let totalNumberOfBytes = 0;
  const stringSizesArray = new Uint32Array(batchAttributes.length);
  const stringBufferArray = [];

  for (let index = 0; index < batchAttributes.length; index++) {
    const currentString = `${String(batchAttributes[index])}\0`;
    const currentStringBuffer = Buffer.from(currentString);
    const currentStringSize = currentStringBuffer.length;
    totalNumberOfBytes += currentStringSize;
    stringSizesArray[index] = currentStringSize;
    stringBufferArray.push(currentStringBuffer);
  }

  const totalBytes = new Uint32Array([totalNumberOfBytes]);

  return concatenateArrayBuffers(
    stringCountArray.buffer,
    totalBytes.buffer,
    stringSizesArray.buffer,
    ...stringBufferArray
  );
}

/**
 * Convert featureIds to BigUint64Array.
 * @param {Array} featureIds
 * @returns {BigUint64Array} - Array of feature ids in BigUint64 format.
 */
function generateBigUint64Array(featureIds) {
  const typedFeatureIds = new BigUint64Array(featureIds.length);
  for (let index = 0; index < featureIds.length; index++) {
    typedFeatureIds[index] = BigInt(featureIds[index]);
  }
  return typedFeatureIds;
}

/**
 * Generates draco compressed geometry
 * @param {Number} vertexCount
 * @param {Object} convertedAttributes
 * @returns {Promise<object>} - COmpressed geometry.
 */
async function generateCompressedGeometry(vertexCount, convertedAttributes, attributes) {
  const {positions, normals, texCoords, colors, featureIds, faceRange} = attributes;
  const indices = new Uint32Array(vertexCount);

  for (let index = 0; index < indices.length; index++) {
    indices.set([index], index);
  }

  const featureIndices = new Uint32Array(
    convertedAttributes.featureIndices.length ? convertedAttributes.featureIndices : vertexCount
  );

  const featureIndex = generateFeatureIndexAttribute(featureIndices, faceRange);

  const compressedAttributes = {
    position: positions,
    normal: normals,
    uv0: texCoords,
    color: colors,
    'feature-index': featureIndex
  };

  const attributesMetadata = {
    'feature-index': {
      'i3s-attribute-type': 'feature-index',
      'i3s-feature-ids': new Int32Array(featureIds)
    }
  };

  return new Uint8Array(
    await encode({attributes: compressedAttributes, indices}, DracoWriter, {
      draco: {
        method: 'MESH_SEQUENTIAL_ENCODING',
        attributesMetadata
      }
    })
  );
}

/**
 * Generates ordered feature indices based on face range
 * @param {Uint32Array} featureIndex
 * @param {Uint32Array} faceRange
 * @returns {Uint32Array}
 */
function generateFeatureIndexAttribute(featureIndex, faceRange) {
  const orderedFeatureIndices = new Uint32Array(featureIndex.length);
  let fillIndex = 0;
  let startIndex = 0;

  for (let index = 1; index < faceRange.length; index += 2) {
    const endIndex = (faceRange[index] + 1) * VALUES_PER_VERTEX;

    orderedFeatureIndices.fill(fillIndex, startIndex, endIndex);

    fillIndex++;
    startIndex = endIndex + 1;
  }

  return orderedFeatureIndices;
}
