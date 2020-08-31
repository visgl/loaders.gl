import {Vector3, Matrix4, Vector4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';
import {concatenateArrayBuffers, concatenateTypedArrays} from '@loaders.gl/loader-utils';

const VALUES_PER_VERTEX = 3;
const VALUES_PER_TEX_COORD = 2;
const VALUES_PER_COLOR_ELEMENT = 4;

export default async function convertB3dmToI3sGeometry(tileContent, options = {}) {
  const {positions, normals, texCoords, colors} = convertAttributes(tileContent);
  const {material, texture} = convertMaterial(tileContent);

  const vertexCount = positions.length / VALUES_PER_VERTEX;
  const header = new Uint32Array(2);
  header.set([vertexCount], 0);

  const fileBuffer = new Uint8Array(
    concatenateArrayBuffers(
      header.buffer,
      positions.buffer,
      normals.buffer,
      texCoords.buffer,
      colors.buffer
    )
  );

  let compressedGeometry = null;
  if (options.draco) {
    const indices = new Uint32Array(vertexCount);
    for (let index = 0; index < indices.length; index++) {
      indices.set([index], index);
    }

    const attributes = {
      positions,
      normals,
      texCoords,
      colors
    };
    compressedGeometry = new Uint8Array(
      await encode({attributes, indices}, DracoWriter, {
        draco: {
          method: 'MESH_SEQUENTIAL_ENCODING'
        }
      })
    );
  }

  return {
    geometry: fileBuffer,
    compressedGeometry,
    texture,
    sharedResources: getSharedResources(tileContent),
    meshMaterial: material
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
  const nodes = tileContent.gltf.scene.nodes;
  const convertedAttributes = convertNodes(nodes, tileContent, {
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
  {positions, normals, texCoords},
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  if (nodes) {
    for (const node of nodes) {
      const newAttributes = convertNode(node, tileContent, {positions, normals, texCoords}, matrix);
      positions = newAttributes.positions;
      normals = newAttributes.normals;
      texCoords = newAttributes.texCoords;
    }
  }
  return {positions, normals, texCoords};
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
  {positions, normals, texCoords},
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  const nodeMatrix = node.matrix;
  const compositeMatrix = nodeMatrix ? matrix.multiplyRight(nodeMatrix) : matrix;

  const mesh = node.mesh;
  if (mesh) {
    const newAttributes = convertMesh(
      mesh,
      tileContent,
      {positions, normals, texCoords},
      compositeMatrix
    );
    positions = newAttributes.positions;
    normals = newAttributes.normals;
    texCoords = newAttributes.texCoords;
  }

  const newAttributes = convertNodes(
    node.children,
    tileContent,
    {positions, normals, texCoords},
    compositeMatrix
  );
  positions = newAttributes.positions;
  normals = newAttributes.normals;
  texCoords = newAttributes.texCoords;

  return {positions, normals, texCoords};
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
  {positions, normals, texCoords},
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  for (const primitive of mesh.primitives) {
    const attributes = primitive.attributes;
    const batchIds = content.batchTableJson && content.batchTableJson.id;
    // Common case - indices are applied for vertices
    if (!(batchIds && batchIds.length) || !isBatchedIndices(primitive.indices, attributes)) {
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
      continue; // eslint-disable-line
    }
    /* For this case indices are applicable for batch, not for all vertex array.
      1. Cut vertices with batchId===0,
      2. Apply indices on resulting array,
      3. Cut next vertices' range by batchId,
      4. Apply indices on resulting range etc.*/
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
          matrix,
          primitive.indices.value
        )
      );

      normals = concatenateTypedArrays(
        normals,
        transformVertexArray(
          newNormals,
          content.cartographicOrigin,
          content.cartesianModelMatrix,
          matrix,
          primitive.indices.value
        )
      );

      texCoords = concatenateTypedArrays(
        texCoords,
        flattenTexCoords(newTexCoords, primitive.indices.value)
      );
    }
  }
  return {positions, normals, texCoords};
}

/**
 * Check if batchedIds are applied for vertex indices array, not for vertex array
 * @param {Object} indices - gltf primitive indices array
 * @param {Object} attributes - gltf primitive attributes
 * @returns {boolean}
 */
function isBatchedIndices(indices, attributes) {
  const {positions} = getValuesByBatchId(attributes, 0);
  return indices.max < positions.length;
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
    newTexCoords[i * VALUES_PER_TEX_COORD + 2] = texCoord[2];
  }
  return newTexCoords;
}

/* eslint-disable max-statements */
/**
 * Cut attributes from array by "batchId"
 * @param {Object} attributes - gltf primitive attributes
 * @param {number} batchId - batchId to select corresponding range of attributes
 * @returns {Object}
 * {
 *   positions: Float32Array,
 *   normals: Float32Array,
 *   texCoords: Float32Array
 * }
 */
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
function getSharedResources(tileContent) {
  const gltfMaterials = tileContent.gltf.materials;
  const i3sResources = {};

  if (!gltfMaterials || !gltfMaterials.length) {
    return i3sResources;
  }

  i3sResources.materialDefinitionInfos = [];
  for (const gltfMaterial of gltfMaterials) {
    const {materialDefinitionInfo, textureDefinitionInfo} = convertGLTFMaterialToI3sSharedResources(
      gltfMaterial
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
function convertGLTFMaterialToI3sSharedResources(gltfMaterial) {
  const texture = gltfMaterial.pbrMetallicRoughness.baseColorTexture;
  let textureDefinitionInfo = null;
  if (texture) {
    textureDefinitionInfo = extractSharedResourcesTextureInfo(texture.texture);
  }
  return {
    materialDefinitionInfo: extractSharedResourcesMaterialInfo(
      gltfMaterial.pbrMetallicRoughness.baseColorFactor,
      gltfMaterial.pbrMetallicRoughness.metallicFactor
    ),
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
function extractSharedResourcesMaterialInfo(baseColorFactor, metallicFactor) {
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
function extractSharedResourcesTextureInfo(texture) {
  return {
    encoding: [texture.source.mimeType],
    images: [
      {
        // 'i3s' has just size which is width of the image. Images are supposed to be square.
        // https://github.com/Esri/i3s-spec/blob/master/docs/1.7/image.cmn.md
        size: texture.source.image.width,
        length: [texture.source.image.data.length]
      }
    ]
  };
}
