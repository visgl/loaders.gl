import type {Image, MeshPrimitive} from 'modules/gltf/src/lib/types/gltf-postprocessed-schema';
import type {B3DMContent, FeatureTableJson} from '@loaders.gl/3d-tiles';

import {Vector3, Matrix4, Vector4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

import {DracoWriterWorker} from '@loaders.gl/draco';
import {assert, encode} from '@loaders.gl/core';
import {concatenateArrayBuffers, concatenateTypedArrays} from '@loaders.gl/loader-utils';
import md5 from 'md5';
import {generateAttributes} from './geometry-attributes';
import {createBoundingVolumesFromGeometry} from './coordinate-converter';
import {
  ConvertedAttributes,
  I3SConvertedResources,
  I3SMaterialWithTexture,
  SharedResourcesArrays
} from '../types';
import {GLTFMaterialPostprocessed, GLTFNodePostprocessed} from '@loaders.gl/gltf';
import {
  AttributeStorageInfo,
  I3SMaterialDefinition,
  MaterialDefinitionInfo,
  TextureDefinitionInfo
} from '@loaders.gl/i3s';
import {TypedArray} from '@loaders.gl/schema';
import {Geoid} from '@math.gl/geoid';
import {
  GLTFAccessorPostprocessed,
  GLTFMeshPostprocessed,
  GLTFTexturePostprocessed
} from 'modules/gltf/src/lib/types/gltf-types';
import {B3DMAttributesData /*transformI3SAttributesOnWorker */} from '../../i3s-attributes-worker';
import {prepareDataForAttributesConversion} from './gltf-attributes';
import {handleBatchIdsExtensions} from './batch-ids-extensions';

// Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/pbrMetallicRoughness.cmn.md
const DEFAULT_ROUGHNESS_FACTOR = 1;
const DEFAULT_METALLIC_FACTOR = 1;

const VALUES_PER_VERTEX = 3;
const VALUES_PER_TEX_COORD = 2;
const VALUES_PER_COLOR_ELEMENT = 4;

const STRING_TYPE = 'string';
const SHORT_INT_TYPE = 'Int32';
const DOUBLE_TYPE = 'Float64';
const OBJECT_ID_TYPE = 'Oid32';
/*
 * 'CUSTOM_ATTRIBUTE_2' - Attribute name which includes batch info and used by New York map.
 * _BATCHID - Default attribute name which includes batch info.
 * BATCHID - Legacy attribute name which includes batch info.
 */
const BATCHED_ID_POSSIBLE_ATTRIBUTE_NAMES = ['CUSTOM_ATTRIBUTE_2', '_BATCHID', 'BATCHID'];

let scratchVector = new Vector3();

/**
 * Convert binary data from b3dm file to i3s resources
 *
 * @param tileContent - 3d tile content
 * @param nodeId - target nodeId. If a few nodes will be created - ids will be nodeId+n where n - index in the resulting array
 * @param featuresHashArray - hash array of features that is needed to not to mix up same features in parent and child nodes
 * @param attributeStorageInfo - attributes metadata from 3DSceneLayer json
 * @param draco - is converter should create draco compressed geometry
 * @param generateBoundingVolumes - is converter should create accurate bounding voulmes from geometry attributes
 * @param geoidHeightModel - model to convert elevation from elipsoidal to geoid
 * @returns Array of node resources to create one or more i3s nodes
 */
export default async function convertB3dmToI3sGeometry(
  tileContent: B3DMContent,
  nodeId: number,
  propertyTable: FeatureTableJson | null,
  featuresHashArray: string[],
  attributeStorageInfo: AttributeStorageInfo[] | undefined,
  draco: boolean,
  generateBoundingVolumes: boolean,
  geoidHeightModel: Geoid,
  workerSource: {[key: string]: string}
) {
  const useCartesianPositions = generateBoundingVolumes;
  const materialAndTextureList: I3SMaterialWithTexture[] = convertMaterials(
    tileContent.gltf?.materials
  );

  const dataForAttributesConversion = prepareDataForAttributesConversion(tileContent);

  const convertedAttributesMap: Map<string, ConvertedAttributes> = await convertAttributes(
    dataForAttributesConversion,
    useCartesianPositions
  );
  // TODO uncomment it when worker will be published on CDN.
  /*
  const convertedAttributesMap: Map<string, ConvertedAttributes> =
    await transformI3SAttributesOnWorker(dataForAttributesConversion, {
      useCartesianPositions,
      source: workerSource.I3SAttributes
    });
  */

  if (generateBoundingVolumes) {
    _generateBoundingVolumesFromGeometry(convertedAttributesMap, geoidHeightModel);
  }

  if (convertedAttributesMap.has('default')) {
    materialAndTextureList.push({
      material: getDefaultMaterial()
    });
  }

  const result: I3SConvertedResources[] = [];
  let nodesCounter = nodeId;
  let {materials = []} = tileContent.gltf || {materials: []};
  if (!materials?.length) {
    materials.push({id: 'default'});
  }
  for (let i = 0; i < materials.length; i++) {
    const sourceMaterial = materials[i];
    if (!convertedAttributesMap.has(sourceMaterial.id)) {
      continue; // eslint-disable-line no-continue
    }
    const convertedAttributes = convertedAttributesMap.get(sourceMaterial.id);
    if (!convertedAttributes) {
      continue;
    }
    const {material, texture} = materialAndTextureList[i];
    result.push(
      await _makeNodeResources({
        convertedAttributes,
        material,
        texture,
        tileContent,
        nodeId: nodesCounter,
        featuresHashArray,
        propertyTable,
        attributeStorageInfo,
        draco,
        workerSource
      })
    );
    nodesCounter++;
  }

  if (!result.length) {
    return null;
  }
  return result;
}

/**
 * Create bounding volumes based on positions
 * @param convertedAttributesMap - geometry attributes map
 * @param geoidHeightModel - geoid height model to convert elevation from elipsoidal to geoid
 */
function _generateBoundingVolumesFromGeometry(
  convertedAttributesMap: Map<string, ConvertedAttributes>,
  geoidHeightModel: Geoid
) {
  for (const attributes of convertedAttributesMap.values()) {
    const boundingVolumes = createBoundingVolumesFromGeometry(
      attributes.positions,
      geoidHeightModel
    );

    attributes.boundingVolumes = boundingVolumes;
    const cartographicOrigin = boundingVolumes.obb.center;

    for (let index = 0; index < attributes.positions.length; index += VALUES_PER_VERTEX) {
      const vertex = attributes.positions.subarray(index, index + VALUES_PER_VERTEX);
      Ellipsoid.WGS84.cartesianToCartographic(Array.from(vertex), scratchVector);
      scratchVector[2] =
        scratchVector[2] - geoidHeightModel.getHeight(scratchVector[1], scratchVector[0]);
      scratchVector = scratchVector.subtract(cartographicOrigin);
      attributes.positions.set(scratchVector, index);
    }
  }
}

/**
 *
 * @param params
 * @param params.convertedAttributes - Converted geometry attributes
 * @param params.material - I3S PBR-like material definition
 * @param params.texture - texture content
 * @param params.tileContent - B3DM decoded content
 * @param params.nodeId - new node ID
 * @param params.featuresHashArray - hash array of features that is needed to not to mix up same features in parent and child nodes
 * @param params.attributesStorageInfo - attributes metadata from 3DSceneLayer json
 * @param params.draco - is converter should create draco compressed geometry
 * @returns Array of I3S node resources
 */
async function _makeNodeResources({
  convertedAttributes,
  material,
  texture,
  tileContent,
  nodeId,
  featuresHashArray,
  propertyTable,
  attributeStorageInfo,
  draco,
  workerSource
}: {
  convertedAttributes: ConvertedAttributes;
  material: I3SMaterialDefinition;
  texture?: {};
  tileContent: B3DMContent;
  nodeId: number;
  featuresHashArray: string[];
  propertyTable: FeatureTableJson | null;
  attributeStorageInfo?: AttributeStorageInfo[];
  draco: boolean;
  workerSource: {[key: string]: string};
}): Promise<I3SConvertedResources> {
  const boundingVolumes = convertedAttributes.boundingVolumes;
  const vertexCount = convertedAttributes.positions.length / VALUES_PER_VERTEX;
  const {faceRange, featureIds, positions, normals, colors, texCoords, featureCount} =
    generateAttributes(convertedAttributes);

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
      texture ? texCoords.buffer : new ArrayBuffer(0),
      colors.buffer,
      typedFeatureIds.buffer,
      faceRange.buffer
    )
  );
  const compressedGeometry = draco
    ? generateCompressedGeometry(
        vertexCount,
        convertedAttributes,
        {
          positions,
          normals,
          texCoords: texture ? texCoords : new Float32Array(0),
          colors,
          featureIds,
          faceRange
        },
        workerSource.draco
      )
    : null;

  let attributes: ArrayBuffer[] = [];

  if (attributeStorageInfo && propertyTable) {
    attributes = convertPropertyTableToAttributeBuffers(
      featureIds,
      propertyTable,
      attributeStorageInfo
    );
  }

  return {
    geometry: fileBuffer,
    compressedGeometry,
    texture,
    sharedResources: getSharedResources(tileContent.gltf?.materials || [], nodeId),
    meshMaterial: material,
    vertexCount,
    attributes,
    featureCount,
    boundingVolumes
  };
}

/**
 * Convert attributes from the gltf nodes tree to i3s plain geometry
 * @param tileContent - 3d tile content
 * @param useCartesianPositions - convert positions to absolute cartesian coordinates instead of cartographic offsets.
 * Cartesian coordinates will be required for creating bounding voulmest from geometry positions
 * @returns map of converted geometry attributes
 */
export async function convertAttributes(
  attributesData: B3DMAttributesData,
  useCartesianPositions: boolean
): Promise<Map<string, ConvertedAttributes>> {
  const {gltfMaterials, nodes, cartographicOrigin, cartesianModelMatrix} = attributesData;
  const attributesMap = new Map<string, ConvertedAttributes>();

  for (const material of gltfMaterials || [{id: 'default'}]) {
    attributesMap.set(material.id, {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      texCoords: new Float32Array(0),
      colors: new Uint8Array(0),
      featureIndicesGroups: [],
      featureIndices: [],
      boundingVolumes: null
    });
  }

  convertNodes(
    nodes,
    cartographicOrigin,
    cartesianModelMatrix,
    attributesMap,
    useCartesianPositions
  );

  for (const attrKey of attributesMap.keys()) {
    const attributes = attributesMap.get(attrKey);
    if (!attributes) {
      continue;
    }
    if (attributes.positions.length === 0) {
      attributesMap.delete(attrKey);
      continue; // eslint-disable-line no-continue
    }
    if (attributes.featureIndicesGroups) {
      attributes.featureIndices = attributes.featureIndicesGroups.reduce((acc, value) =>
        acc.concat(value)
      );
      delete attributes.featureIndicesGroups;
    }
  }

  return attributesMap;
}

/**
 * Gltf has hierarchical structure of nodes. This function converts nodes starting from those which are in gltf scene object.
 *   The goal is applying tranformation matrix for all children. Functions "convertNodes" and "convertNode" work together recursively.
 * @param nodes - gltf nodes array
 * @param tileContent - 3d tile content
 * @param attributesMap - for recursive concatenation of attributes
 * @param useCartesianPositions - convert positions to absolute cartesian coordinates instead of cartographic offsets.
 * Cartesian coordinates will be required for creating bounding voulmest from geometry positions
 * @param matrix - transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @returns {void}
 */
function convertNodes(
  nodes: GLTFNodePostprocessed[],
  cartographicOrigin: Vector3,
  cartesianModelMatrix: Matrix4,
  attributesMap: Map<string, ConvertedAttributes>,
  useCartesianPositions: boolean,
  matrix: Matrix4 = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  if (nodes) {
    for (const node of nodes) {
      convertNode(
        node,
        cartographicOrigin,
        cartesianModelMatrix,
        attributesMap,
        useCartesianPositions,
        matrix
      );
    }
  }
}

/**
 * Generate transformation matrix for node
 * Aapply all gltf transformations to initial transformation matrix.
 * @param node
 * @param matrix
 */
function getCompositeTransformationMatrix(node, matrix) {
  let transformationMatrix = matrix;

  const {matrix: nodeMatrix, rotation, scale, translation} = node;

  if (nodeMatrix) {
    transformationMatrix = matrix.multiplyRight(nodeMatrix);
  }

  if (translation) {
    transformationMatrix = transformationMatrix.translate(translation);
  }

  if (rotation) {
    transformationMatrix = transformationMatrix.rotateXYZ(rotation);
  }

  if (scale) {
    transformationMatrix = transformationMatrix.scale(scale);
  }

  return transformationMatrix;
}

/**
 * Convert all primitives of node and all children nodes
 * @param node - gltf node
 * @param {Object} tileContent - 3d tile content
 * @param {Map} attributesMap Map<{positions: Float32Array, normals: Float32Array, texCoords: Float32Array, colors: Uint8Array, featureIndices: Array}> - for recursive concatenation of
 *   attributes
 * @param useCartesianPositions - convert positions to absolute cartesian coordinates instead of cartographic offsets.
 * Cartesian coordinates will be required for creating bounding voulmest from geometry positions
 * @param {Matrix4} matrix - transformation matrix - cumulative transformation matrix formed from all parent node matrices
 */
function convertNode(
  node: GLTFNodePostprocessed,
  cartographicOrigin: Vector3,
  cartesianModelMatrix: Matrix4,
  attributesMap: Map<string, ConvertedAttributes>,
  useCartesianPositions,
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  const transformationMatrix = getCompositeTransformationMatrix(node, matrix);

  const mesh = node.mesh;
  const images = node.images;

  if (mesh) {
    convertMesh(
      mesh,
      images,
      cartographicOrigin,
      cartesianModelMatrix,
      attributesMap,
      useCartesianPositions,
      transformationMatrix
    );
  }

  convertNodes(
    node.children || [],
    cartographicOrigin,
    cartesianModelMatrix,
    attributesMap,
    useCartesianPositions,
    transformationMatrix
  );
}

/**
 * Convert all primitives of node and all children nodes
 * @param mesh - gltf node
 * @param content - 3d tile content
 * @param useCartesianPositions - convert positions to absolute cartesian coordinates instead of cartographic offsets. 
 * Cartesian coordinates will be required for creating bounding voulmest from geometry positions
 * @param attributesMap Map<{positions: Float32Array, normals: Float32Array, texCoords: Float32Array, colors: Uint8Array, featureIndices: Array}> - for recursive concatenation of
 *   attributes
 
 * @param {Matrix4} matrix - transformation matrix - cumulative transformation matrix formed from all parent node matrices
 */
function convertMesh(
  mesh: GLTFMeshPostprocessed,
  images: Image[],
  cartographicOrigin: Vector3,
  cartesianModelMatrix: Matrix4,
  attributesMap: Map<string, ConvertedAttributes>,
  useCartesianPositions = false,
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
) {
  for (const primitive of mesh.primitives) {
    let outputAttributes: ConvertedAttributes | null | undefined = null;
    if (primitive.material) {
      outputAttributes = attributesMap.get(primitive.material.id);
    } else if (attributesMap.has('default')) {
      outputAttributes = attributesMap.get('default');
    }
    assert(outputAttributes !== null, 'Primitive - material mapping failed');
    const attributes = primitive.attributes;
    if (!outputAttributes) {
      continue;
    }
    outputAttributes.positions = concatenateTypedArrays(
      outputAttributes.positions,
      transformVertexArray({
        vertices: attributes.POSITION.value,
        cartographicOrigin,
        cartesianModelMatrix,
        nodeMatrix: matrix,
        indices: primitive.indices?.value,
        attributeSpecificTransformation: transformVertexPositions,
        useCartesianPositions
      })
    );
    outputAttributes.normals = concatenateTypedArrays(
      outputAttributes.normals,
      transformVertexArray({
        vertices: attributes.NORMAL && attributes.NORMAL.value,
        cartographicOrigin,
        cartesianModelMatrix,
        nodeMatrix: matrix,
        indices: primitive.indices?.value,
        attributeSpecificTransformation: transformVertexNormals,
        useCartesianPositions: false
      })
    );
    outputAttributes.texCoords = concatenateTypedArrays(
      outputAttributes.texCoords,
      flattenTexCoords(
        attributes.TEXCOORD_0 && attributes.TEXCOORD_0.value,
        primitive.indices?.value
      )
    );

    outputAttributes.colors = concatenateTypedArrays(
      outputAttributes.colors,
      flattenColors(attributes.COLOR_0, primitive.indices?.value)
    );

    outputAttributes.featureIndicesGroups = outputAttributes.featureIndicesGroups || [];
    outputAttributes.featureIndicesGroups.push(
      flattenBatchIds(getBatchIds(attributes, primitive, images), primitive.indices?.value)
    );
  }
}

/**
 * Convert vertices attributes (POSITIONS or NORMALS) to i3s compatible format
 * @param args
 * @param args.vertices - gltf primitive POSITION or NORMAL attribute
 * @param args.cartographicOrigin - cartographic origin coordinates
 * @param args.cartesianModelMatrix - a cartesian model matrix to transform coordnates from cartesian to cartographic format
 * @param args.nodeMatrix - a gltf node transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @param args.indices - gltf primitive indices
 * @param args.attributeSpecificTransformation - function to do attribute - specific transformations
 * @param args.useCartesianPositions - use coordinates as it is.
 * @returns {Float32Array}
 */
function transformVertexArray(args: {
  vertices: Float32Array;
  cartographicOrigin: number[];
  cartesianModelMatrix: number[];
  nodeMatrix: Matrix4;
  indices: Uint8Array;
  attributeSpecificTransformation: Function;
  useCartesianPositions: boolean;
}) {
  const {vertices, indices, attributeSpecificTransformation} = args;
  const newVertices = new Float32Array(indices.length * VALUES_PER_VERTEX);
  if (!vertices) {
    return newVertices;
  }
  for (let i = 0; i < indices.length; i++) {
    const coordIndex = indices[i] * VALUES_PER_VERTEX;
    const vertex = vertices.subarray(coordIndex, coordIndex + VALUES_PER_VERTEX);
    let vertexVector = new Vector3(Array.from(vertex));

    vertexVector = attributeSpecificTransformation(vertexVector, args);

    newVertices[i * VALUES_PER_VERTEX] = vertexVector.x;
    newVertices[i * VALUES_PER_VERTEX + 1] = vertexVector.y;
    newVertices[i * VALUES_PER_VERTEX + 2] = vertexVector.z;
  }
  return newVertices;
}

/**
 * Trasform positions vector with the attribute specific transformations
 * @param vertexVector - source positions vector to transform
 * @param calleeArgs
 * @param calleeArgs.cartesianModelMatrix - a cartesian model matrix to transform coordnates from cartesian to cartographic format
 * @param calleeArgs.cartographicOrigin - cartographic origin coordinates
 * @param calleeArgs.nodeMatrix - a gltf node transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @param calleeArgs.useCartesianPositions - use coordinates as it is.
 * @returns transformed positions vector
 */
function transformVertexPositions(vertexVector, calleeArgs): number[] {
  const {cartesianModelMatrix, cartographicOrigin, nodeMatrix, useCartesianPositions} = calleeArgs;

  if (nodeMatrix) {
    vertexVector = vertexVector.transform(nodeMatrix);
  }

  vertexVector = vertexVector.transform(cartesianModelMatrix);

  if (useCartesianPositions) {
    return vertexVector;
  }

  Ellipsoid.WGS84.cartesianToCartographic(
    [vertexVector[0], vertexVector[1], vertexVector[2]],
    vertexVector
  );
  vertexVector = vertexVector.subtract(cartographicOrigin);
  return vertexVector;
}

/**
 * Trasform normals vector with the attribute specific transformations
 * @param vertexVector - source normals vector to transform
 * @param calleeArgs
 * @param calleeArgs.cartesianModelMatrix - a cartesian model matrix to transform coordnates from cartesian to cartographic format
 * @param calleeArgs.nodeMatrix - a gltf node transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @returns transformed normals vector
 */
function transformVertexNormals(vertexVector, calleeArgs): number[] {
  const {cartesianModelMatrix, nodeMatrix} = calleeArgs;

  if (nodeMatrix) {
    vertexVector = vertexVector.transformAsVector(nodeMatrix);
  }

  vertexVector = vertexVector.transformAsVector(cartesianModelMatrix);
  return vertexVector;
}

/**
 * Convert uv0 (texture coordinates) from coords based on indices to plain arrays, compatible with i3s
 * @param texCoords - gltf primitive TEXCOORD_0 attribute
 * @param indices - gltf primitive indices
 * @returns flattened texture coordinates
 */
function flattenTexCoords(texCoords: Float32Array, indices: Uint8Array): Float32Array {
  const newTexCoords = new Float32Array(indices.length * VALUES_PER_TEX_COORD);
  if (!texCoords) {
    // We need dummy UV0s because it is required in 1.6
    // https://github.com/Esri/i3s-spec/blob/master/docs/1.6/vertexAttribute.cmn.md
    newTexCoords.fill(1);
    return newTexCoords;
  }
  for (let i = 0; i < indices.length; i++) {
    const coordIndex = indices[i] * VALUES_PER_TEX_COORD;
    const texCoord = texCoords.subarray(coordIndex, coordIndex + VALUES_PER_TEX_COORD);
    newTexCoords[i * VALUES_PER_TEX_COORD] = texCoord[0];
    newTexCoords[i * VALUES_PER_TEX_COORD + 1] = texCoord[1];
  }
  return newTexCoords;
}

/**
 * Convert color from COLOR_0 based on indices to plain arrays, compatible with i3s
 * @param colorsAttribute - gltf primitive COLOR_0 attribute
 * @param indices - gltf primitive indices
 * @returns flattened colors attribute
 */
function flattenColors(
  colorsAttribute: GLTFAccessorPostprocessed,
  indices: Uint8Array
): Uint8Array {
  const components = colorsAttribute?.components || VALUES_PER_COLOR_ELEMENT;
  const newColors = new Uint8Array(indices.length * components);
  if (!colorsAttribute) {
    // Vertex color multiplies by material color so it must be normalized 1 by default
    newColors.fill(255);
    return newColors;
  }
  const colors = colorsAttribute.value;
  for (let i = 0; i < indices.length; i++) {
    const colorIndex = indices[i] * components;
    const color = colors.subarray(colorIndex, colorIndex + components);
    const colorUint8 = new Uint8Array(components);
    for (let j = 0; j < color.length; j++) {
      colorUint8[j] = color[j] * 255;
    }
    newColors.set(colorUint8, i * components);
  }
  return newColors;
}

/**
 * Flatten batchedIds list based on indices to right ordered array, compatible with i3s
 * @param batchedIds - gltf primitive
 * @param indices - gltf primitive indices
 * @returns flattened batch ids
 */
function flattenBatchIds(batchedIds: number[], indices: Uint8Array): number[] {
  if (!batchedIds.length || !indices.length) {
    return [];
  }
  const newBatchIds: number[] = [];
  for (let i = 0; i < indices.length; i++) {
    const coordIndex = indices[i];
    newBatchIds.push(batchedIds[coordIndex]);
  }
  return newBatchIds;
}

/**
 * Get batchIds for featureIds creation
 * @param attributes
 * @param primitive
 * @param textures
 */
function getBatchIds(
  attributes: {
    [key: string]: GLTFAccessorPostprocessed;
  },
  primitive: MeshPrimitive,
  images: Image[]
): number[] {
  const batchIds: number[] = handleBatchIdsExtensions(attributes, primitive, images);

  if (batchIds.length) {
    return batchIds;
  }

  for (let index = 0; index < BATCHED_ID_POSSIBLE_ATTRIBUTE_NAMES.length; index++) {
    const possibleBatchIdAttributeName = BATCHED_ID_POSSIBLE_ATTRIBUTE_NAMES[index];
    if (
      attributes[possibleBatchIdAttributeName] &&
      attributes[possibleBatchIdAttributeName].value
    ) {
      return attributes[possibleBatchIdAttributeName].value;
    }
  }

  return [];
}

/**
 * Convert GLTF material to I3S material definitions and textures
 * @param sourceMaterials Source GLTF materials
 * @returns Array of Couples I3SMaterialDefinition + texture content
 */
function convertMaterials(
  sourceMaterials: GLTFMaterialPostprocessed[] = []
): I3SMaterialWithTexture[] {
  const result: I3SMaterialWithTexture[] = [];
  for (const sourceMaterial of sourceMaterials) {
    result.push(convertMaterial(sourceMaterial));
  }
  return result;
}

/**
 * Convert texture and material from gltf 2.0 material object
 * @param sourceMaterial - material object
 * @returns I3S material definition and texture
 */
function convertMaterial(sourceMaterial: GLTFMaterialPostprocessed): I3SMaterialWithTexture {
  const material: I3SMaterialDefinition = {
    doubleSided: sourceMaterial.doubleSided,
    emissiveFactor: sourceMaterial.emissiveFactor?.map((c) => Math.round(c * 255)) as [
      number,
      number,
      number
    ],
    // It is in upper case in GLTF: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#alpha-coverage
    // But it is in lower case in I3S: https://github.com/Esri/i3s-spec/blob/master/docs/1.7/materialDefinitions.cmn.md
    alphaMode: convertAlphaMode(sourceMaterial.alphaMode),
    pbrMetallicRoughness: {
      roughnessFactor:
        sourceMaterial?.pbrMetallicRoughness?.roughnessFactor || DEFAULT_ROUGHNESS_FACTOR,
      metallicFactor:
        sourceMaterial?.pbrMetallicRoughness?.metallicFactor || DEFAULT_METALLIC_FACTOR
    }
  };

  let texture;
  if (sourceMaterial?.pbrMetallicRoughness?.baseColorTexture) {
    texture = sourceMaterial.pbrMetallicRoughness.baseColorTexture.texture.source;
    material.pbrMetallicRoughness.baseColorTexture = {
      textureSetDefinitionId: 0
    };
  } else if (sourceMaterial.emissiveTexture) {
    texture = sourceMaterial.emissiveTexture.texture.source;
    // ArcGIS webscene doesn't show emissiveTexture but shows baseColorTexture
    material.pbrMetallicRoughness.baseColorTexture = {
      textureSetDefinitionId: 0
    };
  }

  if (!texture) {
    // Should use default baseColorFactor if it is not present in source material
    // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#reference-pbrmetallicroughness
    const baseColorFactor = sourceMaterial?.pbrMetallicRoughness?.baseColorFactor;
    material.pbrMetallicRoughness.baseColorFactor =
      ((baseColorFactor && baseColorFactor.map((c) => Math.round(c * 255))) as [
        number,
        number,
        number,
        number
      ]) || undefined;
  }

  return {material, texture};
}

/**
 * Converts from `alphaMode` material property from GLTF to I3S format
 * @param gltfAlphaMode Gltf material `alphaMode` property
 * @returns I3SMaterialDefinition.alphaMode property
 */
function convertAlphaMode(
  gltfAlphaMode?: 'OPAQUE' | 'MASK' | 'BLEND' | string
): 'opaque' | 'mask' | 'blend' {
  switch (gltfAlphaMode) {
    case 'OPAQUE':
      return 'opaque';
    case 'MASK':
      return 'mask';
    case 'BLEND':
      return 'blend';
    default:
      return 'opaque';
  }
}

/**
 * Form default I3SMaterialDefinition
 * @returns I3S material definition
 */
function getDefaultMaterial(): I3SMaterialDefinition {
  return {
    alphaMode: 'opaque',
    pbrMetallicRoughness: {
      metallicFactor: 1,
      roughnessFactor: 1
    }
  };
}

/**
 * Form "sharedResources" from gltf materials array
 * @param gltfMaterials - GLTF materials array
 * @param nodeId - I3S node ID
 * @returns {materialDefinitionInfos: Object[], textureDefinitionInfos: Object[]} -
 * 2 arrays in format of i3s sharedResources data https://github.com/Esri/i3s-spec/blob/master/docs/1.7/sharedResource.cmn.md
 */
function getSharedResources(
  gltfMaterials: GLTFMaterialPostprocessed[],
  nodeId: number
): SharedResourcesArrays {
  const i3sResources: SharedResourcesArrays = {};

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
 * @param gltfMaterial - gltf material data
 * @param nodeId - I3S node ID
 * @returns - Couple {materialDefinitionInfo, textureDefinitionInfo} extracted from gltf material data
 */
function convertGLTFMaterialToI3sSharedResources(
  gltfMaterial: GLTFMaterialPostprocessed,
  nodeId: number
): {
  materialDefinitionInfo: MaterialDefinitionInfo;
  textureDefinitionInfo: TextureDefinitionInfo | null;
} {
  const texture =
    gltfMaterial?.pbrMetallicRoughness?.baseColorTexture || gltfMaterial.emissiveTexture;
  let textureDefinitionInfo: TextureDefinitionInfo | null = null;
  if (texture) {
    textureDefinitionInfo = extractSharedResourcesTextureInfo(texture.texture, nodeId);
  }
  const {baseColorFactor, metallicFactor} = gltfMaterial?.pbrMetallicRoughness || {};
  let colorFactor = baseColorFactor;
  // If alpha channel is 0 try to get emissive factor from gltf material.
  if ((!baseColorFactor || baseColorFactor[3] === 0) && gltfMaterial.emissiveFactor) {
    colorFactor = gltfMaterial.emissiveFactor;
    colorFactor[3] = colorFactor[3] || 1;
  }

  return {
    materialDefinitionInfo: extractSharedResourcesMaterialInfo(
      colorFactor || [1, 1, 1, 1],
      metallicFactor
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
 * @param baseColorFactor - RGBA color in 0..1 format
 * @param metallicFactor - "metallicFactor" attribute of gltf material object
 * @returns material definition info for I3S shared resource
 */
function extractSharedResourcesMaterialInfo(
  baseColorFactor: number[],
  metallicFactor: number = 1
): MaterialDefinitionInfo {
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
    params: {
      diffuse: diffuse.toArray(),
      specular: specular.toArray(),
      renderMode: 'solid'
    }
  };
}

/**
 * Form "textureDefinition" which is part of "sharedResouces"
 * @param texture - texture image info
 * @param nodeId - I3S node ID
 * @returns texture definition infor for shared resource
 */
function extractSharedResourcesTextureInfo(
  texture: GLTFTexturePostprocessed,
  nodeId: number
): TextureDefinitionInfo {
  return {
    encoding: texture?.source?.mimeType ? [texture.source.mimeType] : undefined,
    images: [
      {
        // 'i3s' has just size which is width of the image. Images are supposed to be square.
        // https://github.com/Esri/i3s-spec/blob/master/docs/1.7/image.cmn.md
        id: generateImageId(texture, nodeId),
        size: texture.source?.image.width,
        length: [texture.source?.image.data.length]
      }
    ]
  };
}

/**
 * Formula for counting imageId:
 * https://github.com/Esri/i3s-spec/blob/0a6366a9249b831db8436c322f8d27521e86cf07/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md#generating-image-ids
 * @param texture - texture image info
 * @param nodeId - I3S node ID
 * @returns calculate image ID according to the spec
 */
function generateImageId(texture: GLTFTexturePostprocessed, nodeId) {
  const {width, height} = texture.source?.image;
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
 * @param featureIds
 * @param featureIndices
 * @param featuresHashArray
 * @param batchTable
 * @returns {void}
 */
function makeFeatureIdsUnique(
  featureIds: number[],
  featureIndices: number[],
  featuresHashArray: string[],
  batchTable: {[key: string]: any}
) {
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
 * Convert property table data to attribute buffers.
 * @param {Object} propertyTable - table with metadata for particular feature.
 * @param {Array} featureIds
 * @param {Array} attributeStorageInfo
 * @returns {Array} - Array of file buffers.
 */
function convertPropertyTableToAttributeBuffers(
  featureIds: number[],
  propertyTable: FeatureTableJson,
  attributeStorageInfo: AttributeStorageInfo[]
) {
  const attributeBuffers: ArrayBuffer[] = [];

  const needFlattenPropertyTable = checkPropertiesLength(featureIds, propertyTable);
  const properties = needFlattenPropertyTable
    ? flattenPropertyTableByFeatureIds(featureIds, propertyTable)
    : propertyTable;

  const propertyTableWithObjectIds = {
    OBJECTID: featureIds,
    ...properties
  };

  for (const propertyName in propertyTableWithObjectIds) {
    const type = getAttributeType(propertyName, attributeStorageInfo);
    const value = propertyTableWithObjectIds[propertyName];
    const attributeBuffer = generateAttributeBuffer(type, value);

    attributeBuffers.push(attributeBuffer);
  }

  return attributeBuffers;
}

/**
 * Check that all attributes in propertyTable have the same length as FeatureIds.
 * If there are differencies between lengths we should flatten property table based on exiesting featureIds.
 * @param featureIds
 * @param propertyTable
 * @returns
 */
function checkPropertiesLength(featureIds: number[], propertyTable: FeatureTableJson): boolean {
  let needFlatten = false;

  for (const attribute of Object.values(propertyTable)) {
    if (featureIds.length !== attribute.length) {
      needFlatten = true;
    }
  }

  return needFlatten;
}

/**
 * Takes attributes from property table based on featureIds.
 * If there is no property value for particular featureId (index) the property will be null.
 * Example:
 * Initial data:
 *   OBJECTID: [0, 1, 5]
 *   component: ['Windows', 'Frames', 'Wall', 'Roof', 'Skylight']
 * Result:
 *   OBJECTID: [0, 1, 5]
 *   component: ['Windows', 'Frames', 'null']
 * @param featureIds
 * @param propertyTable
 */
function flattenPropertyTableByFeatureIds(
  featureIds: number[],
  propertyTable: FeatureTableJson
): FeatureTableJson {
  const resultPropertyTable: FeatureTableJson = {};
  for (const propertyName in propertyTable) {
    const properties = propertyTable[propertyName];
    resultPropertyTable[propertyName] = getPropertiesByFeatureIds(properties, featureIds);
  }

  return resultPropertyTable;
}

/**
 * Getting properties by featureId index
 * @param properties
 * @param featureIds
 */
function getPropertiesByFeatureIds(properties: any[], featureIds: number[]): any[] {
  const resultProperties: any = [];

  for (const featureId of featureIds) {
    const property = properties[featureId] || null;
    resultProperties.push(property);
  }

  return resultProperties;
}

/**
 * Generates attribute buffer based on attribute type
 * @param type
 * @param value
 */
function generateAttributeBuffer(type: string, value: any): ArrayBuffer {
  let attributeBuffer: ArrayBuffer;

  switch (type) {
    case OBJECT_ID_TYPE:
    case SHORT_INT_TYPE:
      attributeBuffer = generateShortIntegerAttributeBuffer(value);
      break;
    case DOUBLE_TYPE:
      attributeBuffer = generateDoubleAttributeBuffer(value);
      break;
    case STRING_TYPE:
      attributeBuffer = generateStringAttributeBuffer(value);
      break;
    default:
      attributeBuffer = generateStringAttributeBuffer(value);
  }

  return attributeBuffer;
}

/**
 * Return attribute type.
 * @param {String} key
 * @param {Array} attributeStorageInfo
 * @returns {String} attribute type.
 */
function getAttributeType(key, attributeStorageInfo) {
  const attribute = attributeStorageInfo.find((attr) => attr.name === key);
  return attribute.attributeValues.valueType;
}

/**
 * Convert short integer to attribute arrayBuffer.
 * @param {Array} featureIds
 * @returns {ArrayBuffer} - Buffer with objectId data.
 */
function generateShortIntegerAttributeBuffer(featureIds): ArrayBuffer {
  const count = new Uint32Array([featureIds.length]);
  const valuesArray = new Uint32Array(featureIds);
  return concatenateArrayBuffers(count.buffer, valuesArray.buffer);
}

/**
 * Convert double to attribute arrayBuffer.
 * @param {Array} featureIds
 * @returns {ArrayBuffer} - Buffer with objectId data.
 */
function generateDoubleAttributeBuffer(featureIds): ArrayBuffer {
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
function generateStringAttributeBuffer(batchAttributes): ArrayBuffer {
  const stringCountArray = new Uint32Array([batchAttributes.length]);
  let totalNumberOfBytes = 0;
  const stringSizesArray = new Uint32Array(batchAttributes.length);
  const stringBufferArray: ArrayBuffer[] = [];

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
 * @param {Object} convertedAttributes - get rid of this argument here
 * @param {Object} attributes - geometry attributes to compress
 * @param {string} dracoWorkerSoure - draco worker source code
 * @returns {Promise<object>} - COmpressed geometry.
 */
async function generateCompressedGeometry(
  vertexCount,
  convertedAttributes,
  attributes,
  dracoWorkerSoure
) {
  const {positions, normals, texCoords, colors, featureIds, faceRange} = attributes;
  const indices = new Uint32Array(vertexCount);

  for (let index = 0; index < indices.length; index++) {
    indices.set([index], index);
  }

  const featureIndices = new Uint32Array(
    convertedAttributes.featureIndices.length ? convertedAttributes.featureIndices : vertexCount
  );

  const featureIndex = generateFeatureIndexAttribute(featureIndices, faceRange);

  const compressedAttributes: {
    positions: TypedArray;
    normals: TypedArray;
    colors: TypedArray;
    'feature-index': TypedArray;
    texCoords?: TypedArray;
  } = {
    positions,
    normals,
    colors,
    'feature-index': featureIndex
  };

  if (texCoords.length) {
    compressedAttributes.texCoords = texCoords;
  }

  const attributesMetadata = {
    'feature-index': {
      'i3s-attribute-type': 'feature-index',
      'i3s-feature-ids': new Int32Array(featureIds)
    }
  };

  return encode({attributes: compressedAttributes, indices}, DracoWriterWorker, {
    ...DracoWriterWorker.options,
    source: dracoWorkerSoure,
    reuseWorkers: true,
    _nodeWorkers: true,
    draco: {
      method: 'MESH_SEQUENTIAL_ENCODING',
      attributesMetadata
    }
  });
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
