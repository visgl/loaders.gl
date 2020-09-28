import {Vector3, Matrix4, Vector4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';
import {concatenateArrayBuffers, concatenateTypedArrays} from '@loaders.gl/loader-utils';
import draco3d from 'draco3d';

const VALUES_PER_VERTEX = 3;
const VALUES_PER_TEX_COORD = 2;
const VALUES_PER_COLOR_ELEMENT = 4;
/*
* 'CUSTOM_ATTRIBUTE_2' - Attribute name which includes batch info and used by New York map.
* _BATCHID - default attribute name which includes batch info.
*/
const BATCHED_ID_POSSIBLE_ATTRIBUTE_NAMES = ['CUSTOM_ATTRIBUTE_2', '_BATCHID'];

export default async function convertB3dmToI3sGeometry(tileContent, nodeId) {
  const {positions, normals, texCoords, colors, featureIndices} = convertAttributes(tileContent);
  const {material, texture} = convertMaterial(tileContent);
  const vertexCount = positions.length / VALUES_PER_VERTEX;
  const triangleCount = vertexCount / 3;
  const {faceRange, featureIds, featureCount} = generateFeatureAttributes(
    featureIndices,
    triangleCount
  );
  const header = new Uint32Array(2);

  header.set([vertexCount, featureCount], 0);
  const fileBuffer = new Uint8Array(
    concatenateArrayBuffers(
      header.buffer,
      positions.buffer,
      normals.buffer,
      texCoords.buffer,
      colors.buffer,
      featureIds.buffer,
      faceRange.buffer
    )
  );

  const indices = new Uint32Array(vertexCount);
  for (let index = 0; index < indices.length; index++) {
    indices.set([index], index);
  }

  const featureIndex = featureIndices.length ? featureIndices : new Uint32Array(vertexCount);

  const attributes = {
    positions,
    normals,
    texCoords,
    colors,
    'feature-index': featureIndex
  };
  const compressedGeometry = new Uint8Array(
    await encode({attributes, indices}, DracoWriter, {
      draco: {
        method: 'MESH_SEQUENTIAL_ENCODING'
      },
      modules: {
        draco3d
      }
    })
  );

  return {
    geometry: fileBuffer,
    compressedGeometry,
    texture,
    sharedResources: getSharedResources(tileContent, nodeId),
    meshMaterial: material,
    vertexCount
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
  let featureIndices = new Uint32Array(0);

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

    featureIndices = concatenateTypedArrays(
      featureIndices,
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
 * @param {Uint32Array} batchedIds - gltf primitive
 * @param {Uint8Array} indices - gltf primitive indices
 * @returns {Uint32Array}
 */
function flattenBatchIds(batchedIds, indices) {
  if (!batchedIds.length || !indices.length) {
    return new Uint32Array(0);
  }
  const newBatchIds = new Uint32Array(indices.length);
  for (let i = 0; i < indices.length; i++) {
    const coordIndex = indices[i];
    newBatchIds.set([Math.round(batchedIds[coordIndex])], i);
  }
  return newBatchIds;
}
/**
 * Return batchIds based on possible attribute names for different kind of maps.
 * @param {Object} attributes {attributeName: Float32Array}
 * @returns {Uint32Array}
 */
function getBatchIdsByAttributeName(attributes) {
  let batchIds = new Uint32Array(0);

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
    alphaMode: sourceMaterial.alphaMode,
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
    material.pbrMetallicRoughness.baseColorFactor = sourceMaterial.pbrMetallicRoughness.baseColorFactor.map(
      c => Math.round(c * 255)
    );
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
/**
 * Calculate face range, features count and folded featureIds based on featureIndices array.
 * @param {Uint32Array} featureIndices - texture image info
 * @param {Number} triangleCount
 * @returns {Object} {faceRange, featureIds, featureCount}.
 */
function generateFeatureAttributes(featureIndices, triangleCount) {
  if (!featureIndices.length) {
    return {
      faceRange: new Uint32Array([0, triangleCount - 1]),
      featureIds: new Float64Array([0]),
      featureCount: 1
    };
  }

  let rangeIndex = 1;
  let featureIndex = 1;
  let currentFeatureId = featureIndices[0];
  const faceRangeList = [];
  const featureIdsList = [];
  const uniqueFeatureIds = [currentFeatureId];

  faceRangeList[0] = 0;
  featureIdsList[0] = currentFeatureId;

  for (let index = 1; index < featureIndices.length; index++) {
    if (currentFeatureId !== featureIndices[index]) {
      faceRangeList[rangeIndex] = index / VALUES_PER_VERTEX - 1;
      faceRangeList[rangeIndex + 1] = index / VALUES_PER_VERTEX;
      featureIdsList[featureIndex] = featureIndices[index];

      if (!uniqueFeatureIds.includes(featureIndices[index])) {
        uniqueFeatureIds.push(featureIndices[index]);
      }

      rangeIndex += 2;
      featureIndex += 1;
    }
    currentFeatureId = featureIndices[index];
  }

  faceRangeList[rangeIndex] = featureIndices.length / VALUES_PER_VERTEX - 1;

  const faceRange = new Uint32Array(faceRangeList);
  const featureIds = new Float64Array(featureIdsList);
  const featureCount = uniqueFeatureIds.length;

  return {faceRange, featureIds, featureCount};
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

  // eslint-disable-next-line no-undef
  const imageId = BigInt(`0b${leftHalf.toString(2)}${rightHalf}`);
  return imageId.toString();
}
