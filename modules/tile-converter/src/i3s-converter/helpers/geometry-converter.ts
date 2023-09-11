import type {FeatureTableJson, Tiles3DTileContent} from '@loaders.gl/3d-tiles';
import type {
  GLTF_EXT_mesh_features,
  GLTF_EXT_structural_metadata,
  GLTFAccessorPostprocessed,
  GLTFMaterialPostprocessed,
  GLTFNodePostprocessed,
  GLTFMeshPrimitivePostprocessed,
  GLTFMeshPostprocessed,
  GLTFTexturePostprocessed,
  GLTF_EXT_feature_metadata_GLTF
} from '@loaders.gl/gltf';

import {Vector3, Matrix4, Vector4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

import {DracoWriterWorker} from '@loaders.gl/draco';
import {assert, encode} from '@loaders.gl/core';
import {concatenateArrayBuffers, concatenateTypedArrays} from '@loaders.gl/loader-utils';
import md5 from 'md5';
import {v4 as uuidv4} from 'uuid';
import {generateAttributes} from './geometry-attributes';
import {createBoundingVolumesFromGeometry} from './coordinate-converter';
import {
  ConvertedAttributes,
  I3SConvertedResources,
  I3SMaterialWithTexture,
  MergedMaterial,
  SharedResourcesArrays
} from '../types';
import {
  AttributeStorageInfo,
  I3SMaterialDefinition,
  MaterialDefinitionInfo,
  TextureDefinitionInfo
} from '@loaders.gl/i3s';
import {NumberArray, TypedArray} from '@loaders.gl/loader-utils';
import {Geoid} from '@math.gl/geoid';
import {prepareDataForAttributesConversion} from './gltf-attributes';
import {getTextureByMetadataClass, handleBatchIdsExtensions} from './batch-ids-extensions';
import {checkPropertiesLength, flattenPropertyTableByFeatureIds} from './feature-attributes';
import {GL} from '@loaders.gl/math';

/*
  At the moment of writing the type TypedArrayConstructor is not exported in '@math.gl/types'.
  So the following import is replaced with the local import
  import type {TypedArrayConstructor} from '@math.gl/types'; 
*/
import type {GLTFAttributesData, TextureImageProperties, TypedArrayConstructor} from '../types';
import {generateSyntheticIndices} from '../../lib/utils/geometry-utils';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';

import {EXT_MESH_FEATURES, EXT_FEATURE_METADATA, EXT_STRUCTURAL_METADATA} from '@loaders.gl/gltf';

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
 * @param tileTransform - transformation matrix of the tile, calculated recursively multiplying
 *                        transform of all parent tiles and transform of the current tile
 * @param tileBoundingVolume - initialized bounding volume of the source tile
 * @param addNodeToNodePage - function to add new node to node pages
 * @param propertyTable - batch table (corresponding to feature attributes data)
 * @param featuresHashArray - hash array of features that is needed to not to mix up same features in parent and child nodes
 * @param attributeStorageInfo - attributes metadata from 3DSceneLayer json
 * @param draco - is converter should create draco compressed geometry
 * @param generateBoundingVolumes - is converter should create accurate bounding voulmes from geometry attributes
 * @param shouldMergeMaterials - Try to merge similar materials to be able to merge meshes into one node
 * @param geoidHeightModel - model to convert elevation from elipsoidal to geoid
 * @param libraries - dynamicaly loaded 3rd-party libraries
 * @param metadataClass `- user selected feature metadata class name`
 * @returns Array of node resources to create one or more i3s nodes
 */
export default async function convertB3dmToI3sGeometry(
  tileContent: Tiles3DTileContent,
  tileTransform: Matrix4,
  tileBoundingVolume: OrientedBoundingBox | BoundingSphere,
  addNodeToNodePage: () => Promise<number>,
  propertyTable: FeatureTableJson | null,
  featuresHashArray: string[],
  attributeStorageInfo: AttributeStorageInfo[] | undefined,
  draco: boolean,
  generateBoundingVolumes: boolean,
  shouldMergeMaterials: boolean,
  geoidHeightModel: Geoid,
  libraries: Record<string, string>,
  metadataClass?: string
): Promise<I3SConvertedResources[] | null> {
  const useCartesianPositions = generateBoundingVolumes;
  const materialAndTextureList: I3SMaterialWithTexture[] = await convertMaterials(
    tileContent.gltf?.materials,
    shouldMergeMaterials
  );

  const dataForAttributesConversion = prepareDataForAttributesConversion(
    tileContent,
    tileTransform,
    tileBoundingVolume
  );
  const featureTexture = getTextureByMetadataClass(tileContent, metadataClass);
  const convertedAttributesMap: Map<string, ConvertedAttributes> = await convertAttributes(
    dataForAttributesConversion,
    materialAndTextureList,
    useCartesianPositions,
    featureTexture
  );
  /** Usage of worker here brings more overhead than advantage */
  // const convertedAttributesMap: Map<string, ConvertedAttributes> =
  //   await transformI3SAttributesOnWorker(dataForAttributesConversion, {
  //     reuseWorkers: true,
  //     _nodeWorkers: true,
  //     useCartesianPositions,
  //     source: workerSource.I3SAttributes
  //   });

  if (generateBoundingVolumes) {
    _generateBoundingVolumesFromGeometry(convertedAttributesMap, geoidHeightModel);
  }

  const result: I3SConvertedResources[] = [];
  for (const materialAndTexture of materialAndTextureList) {
    const originarMaterialId = materialAndTexture.mergedMaterials[0].originalMaterialId;
    if (!convertedAttributesMap.has(originarMaterialId)) {
      continue; // eslint-disable-line no-continue
    }
    const convertedAttributes = convertedAttributesMap.get(originarMaterialId);
    if (!convertedAttributes) {
      continue;
    }
    const {material, texture} = materialAndTexture;
    const nodeId = await addNodeToNodePage();
    result.push(
      await _makeNodeResources({
        convertedAttributes,
        material,
        texture,
        tileContent,
        nodeId,
        featuresHashArray,
        propertyTable,
        attributeStorageInfo,
        draco,
        libraries
      })
    );
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
 * @param params.tileContent - 3DTiles decoded content
 * @param params.nodeId - new node ID
 * @param params.featuresHashArray - hash array of features that is needed to not to mix up same features in parent and child nodes
 * @param params.propertyTable - batch table (corresponding to feature attributes data)
 * @param params.attributeStorageInfo - attributes metadata from 3DSceneLayer json
 * @param params.draco - is converter should create draco compressed geometry
 * @param libraries - dynamicaly loaded 3rd-party libraries
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
  libraries
}: {
  convertedAttributes: ConvertedAttributes;
  material: I3SMaterialDefinition;
  texture?: {};
  tileContent: Tiles3DTileContent;
  nodeId: number;
  featuresHashArray: string[];
  propertyTable: FeatureTableJson | null;
  attributeStorageInfo?: AttributeStorageInfo[];
  draco: boolean;
  libraries: Record<string, string>;
}): Promise<I3SConvertedResources> {
  const boundingVolumes = convertedAttributes.boundingVolumes;
  const vertexCount = convertedAttributes.positions.length / VALUES_PER_VERTEX;
  const {faceRange, featureIds, positions, normals, colors, uvRegions, texCoords, featureCount} =
    generateAttributes(convertedAttributes);

  let featureIdsMap: Record<string, number> = {};
  if (propertyTable) {
    featureIdsMap = makeFeatureIdsUnique(
      featureIds,
      convertedAttributes.featureIndices,
      featuresHashArray,
      propertyTable
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
      uvRegions,
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
          uvRegions,
          featureIds,
          faceRange
        },
        libraries
      )
    : null;

  let attributes: ArrayBuffer[] = [];

  if (attributeStorageInfo && propertyTable) {
    attributes = convertPropertyTableToAttributeBuffers(
      featureIds,
      featureIdsMap,
      propertyTable,
      attributeStorageInfo
    );
  }

  return {
    nodeId,
    geometry: fileBuffer,
    compressedGeometry,
    texture,
    hasUvRegions: Boolean(uvRegions.length),
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
 * @param attributesData - geometry attributes from gltf
 * @param materialAndTextureList - array of data about materials and textures of the content
 * @param useCartesianPositions - convert positions to absolute cartesian coordinates instead of cartographic offsets.
 * Cartesian coordinates will be required for creating bounding voulmest from geometry positions
 * @param featureTexture - feature texture key
 * @returns map of converted geometry attributes
 */
export async function convertAttributes(
  attributesData: GLTFAttributesData,
  materialAndTextureList: I3SMaterialWithTexture[],
  useCartesianPositions: boolean,
  featureTexture: string | null
): Promise<Map<string, ConvertedAttributes>> {
  const {nodes, images, cartographicOrigin, cartesianModelMatrix} = attributesData;
  const attributesMap = new Map<string, ConvertedAttributes>();

  for (const materialAndTexture of materialAndTextureList) {
    const attributes = {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      texCoords: new Float32Array(0),
      colors: new Uint8Array(0),
      uvRegions: new Uint16Array(0),
      featureIndicesGroups: [],
      featureIndices: [],
      boundingVolumes: null,
      mergedMaterials: materialAndTexture.mergedMaterials
    };
    for (const mergedMaterial of materialAndTexture.mergedMaterials) {
      attributesMap.set(mergedMaterial.originalMaterialId, attributes);
    }
  }

  convertNodes(
    nodes,
    images,
    cartographicOrigin,
    cartesianModelMatrix,
    attributesMap,
    useCartesianPositions,
    undefined,
    featureTexture
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
 * @param images - gltf images array
 * @param cartographicOrigin - cartographic origin of bounding volume
 * @param cartesianModelMatrix - cartesian model matrix to convert coordinates to cartographic
 * @param attributesMap - for recursive concatenation of attributes
 * @param useCartesianPositions - convert positions to absolute cartesian coordinates instead of cartographic offsets.
 * Cartesian coordinates will be required for creating bounding voulmest from geometry positions
 * @param matrix - transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @param featureTexture - feature texture key
 * @returns {void}
 */
function convertNodes(
  nodes: GLTFNodePostprocessed[],
  images: (TextureImageProperties | null)[],
  cartographicOrigin: Vector3,
  cartesianModelMatrix: Matrix4,
  attributesMap: Map<string, ConvertedAttributes>,
  useCartesianPositions: boolean,
  matrix: Matrix4 = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  featureTexture: string | null
) {
  if (nodes) {
    for (const node of nodes) {
      convertNode(
        node,
        images,
        cartographicOrigin,
        cartesianModelMatrix,
        attributesMap,
        useCartesianPositions,
        matrix,
        featureTexture
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
function getCompositeTransformationMatrix(node: GLTFNodePostprocessed, matrix: Matrix4) {
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
 * @param images - gltf images array
 * @param cartographicOrigin - cartographic origin of bounding volume
 * @param cartesianModelMatrix - cartesian model matrix to convert coordinates to cartographic
 * @param attributesMap Map<{positions: Float32Array, normals: Float32Array, texCoords: Float32Array, colors: Uint8Array, featureIndices: Array}> - for recursive concatenation of
 *   attributes
 * @param useCartesianPositions - convert positions to absolute cartesian coordinates instead of cartographic offsets.
 * Cartesian coordinates will be required for creating bounding voulmest from geometry positions
 * @param matrix - transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @param featureTexture - feature texture key
 */
function convertNode(
  node: GLTFNodePostprocessed,
  images: (TextureImageProperties | null)[],
  cartographicOrigin: Vector3,
  cartesianModelMatrix: Matrix4,
  attributesMap: Map<string, ConvertedAttributes>,
  useCartesianPositions,
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  featureTexture: string | null
) {
  const transformationMatrix = getCompositeTransformationMatrix(node, matrix);

  const mesh = node.mesh;

  if (mesh) {
    convertMesh(
      mesh,
      images,
      cartographicOrigin,
      cartesianModelMatrix,
      attributesMap,
      useCartesianPositions,
      transformationMatrix,
      featureTexture
    );
  }

  convertNodes(
    node.children || [],
    images,
    cartographicOrigin,
    cartesianModelMatrix,
    attributesMap,
    useCartesianPositions,
    transformationMatrix,
    featureTexture
  );
}

/**
 * Convert all primitives of the mesh
 * @param mesh - gltf mesh data
 * @param images - gltf images array
 * @param cartographicOrigin - cartographic origin of bounding volume
 * @param cartesianModelMatrix - cartesian model matrix to convert coordinates to cartographic
 * @param attributesMap Map<{positions: Float32Array, normals: Float32Array, texCoords: Float32Array, colors: Uint8Array, featureIndices: Array}> - for recursive concatenation of
 *   attributes
 * @param useCartesianPositions - convert positions to absolute cartesian coordinates instead of cartographic offsets.
 * Cartesian coordinates will be required for creating bounding voulmest from geometry positions
 * @param attributesMap Map<{positions: Float32Array, normals: Float32Array, texCoords: Float32Array, colors: Uint8Array, featureIndices: Array}> - for recursive concatenation of
 *   attributes
 * @param matrix - transformation matrix - cumulative transformation matrix formed from all parent node matrices
 * @param featureTexture - feature texture key
 */
function convertMesh(
  mesh: GLTFMeshPostprocessed,
  images: (TextureImageProperties | null)[],
  cartographicOrigin: Vector3,
  cartesianModelMatrix: Matrix4,
  attributesMap: Map<string, ConvertedAttributes>,
  useCartesianPositions = false,
  matrix = new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  featureTexture: string | null
) {
  for (const primitive of mesh.primitives) {
    let outputAttributes: ConvertedAttributes | null | undefined = null;
    let materialUvRegion: Uint16Array | undefined;
    if (primitive.material) {
      outputAttributes = attributesMap.get(primitive.material.id);
      materialUvRegion = outputAttributes?.mergedMaterials.find(
        ({originalMaterialId}) => originalMaterialId === primitive.material?.id
      )?.uvRegion;
    } else if (attributesMap.has('default')) {
      outputAttributes = attributesMap.get('default');
    }
    assert(outputAttributes !== null, 'Primitive - material mapping failed');
    // Per the spec https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#_mesh_primitive_mode
    // GL.TRIANGLES is default. So in case `mode` is `undefined`, it is 'TRIANGLES'
    assert(
      primitive.mode === undefined ||
        primitive.mode === GL.TRIANGLES ||
        primitive.mode === GL.TRIANGLE_STRIP,
      `Primitive - unsupported mode ${primitive.mode}`
    );
    const attributes = primitive.attributes;
    if (!outputAttributes) {
      continue;
    }

    const indices = normalizeIndices(primitive);
    outputAttributes.positions = concatenateTypedArrays(
      outputAttributes.positions,
      transformVertexArray({
        vertices: attributes.POSITION.value,
        cartographicOrigin,
        cartesianModelMatrix,
        nodeMatrix: matrix,
        indices,
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
        indices,
        attributeSpecificTransformation: transformVertexNormals,
        useCartesianPositions: false
      })
    );
    outputAttributes.texCoords = concatenateTypedArrays(
      outputAttributes.texCoords,
      flattenTexCoords(attributes.TEXCOORD_0 && attributes.TEXCOORD_0.value, indices)
    );

    outputAttributes.colors = concatenateTypedArrays(
      outputAttributes.colors,
      flattenColors(attributes.COLOR_0, indices)
    );

    if (materialUvRegion) {
      outputAttributes.uvRegions = concatenateTypedArrays(
        outputAttributes.uvRegions,
        createUvRegion(materialUvRegion, indices)
      );
    }

    outputAttributes.featureIndicesGroups = outputAttributes.featureIndicesGroups || [];
    outputAttributes.featureIndicesGroups.push(
      flattenBatchIds(getBatchIds(attributes, primitive, images, featureTexture), indices)
    );
  }
}
/**
 * Converts TRIANGLE-STRIPS to independent TRIANGLES
 * @param primitive - the primitive to get the indices from
 * @returns indices of vertices of the independent triangles
 */
function normalizeIndices(primitive: GLTFMeshPrimitivePostprocessed): TypedArray {
  let indices: TypedArray | undefined = primitive.indices?.value;
  if (!indices) {
    const positions = primitive.attributes.POSITION.value;
    return generateSyntheticIndices(positions.length / VALUES_PER_VERTEX);
  }

  if (indices && primitive.mode === GL.TRIANGLE_STRIP) {
    /*
    TRIANGLE_STRIP geometry contains n+2 vertices for n triangles;
    TRIANGLE geometry contains n*3 vertices for n triangles.
    The conversion from TRIANGLE_STRIP to TRIANGLE implies duplicating adjacent vertices.
    */
    const TypedArrayConstructor = indices.constructor as TypedArrayConstructor;
    const newIndices = new TypedArrayConstructor((indices.length - 2) * 3);

    // Copy the first triangle indices with no modification like [i0, i1, i2, ...] -> [i0, i1, i2, ...]
    let triangleIndex = 0;
    let currentTriangle = indices.slice(0, 3);
    newIndices.set(currentTriangle, 0);

    // The rest triangle indices are being taken from strips using the following logic:
    // [i1, i2, i3, i4, i5, i6, ...] -> [i3, i2, i1,   i2, i3, i4,   i5, i4, i3,   i4, i5, i6, ...]
    for (let i = 1; i + 2 < indices.length; i++) {
      triangleIndex += 3;
      currentTriangle = indices.slice(i, i + 3);
      if (i % 2 === 0) {
        newIndices.set(currentTriangle, triangleIndex);
      } else {
        // The following "reverce" is necessary to calculate normals correctly
        newIndices.set(currentTriangle.reverse(), triangleIndex);
      }
    }
    indices = newIndices;
  }
  return indices as TypedArray;
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
 * @returns
 */
function transformVertexArray(args: {
  vertices: TypedArray;
  cartographicOrigin: number[];
  cartesianModelMatrix: number[];
  nodeMatrix: Matrix4;
  indices: TypedArray;
  attributeSpecificTransformation: Function;
  useCartesianPositions: boolean;
}): Float32Array {
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
function flattenTexCoords(texCoords: TypedArray, indices: TypedArray): Float32Array {
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
  indices: TypedArray
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
 * Create per-vertex uv-region array
 * @param materialUvRegion - uv-region fragment for a single vertex
 * @param indices - geometry indices data
 * @returns - uv-region array
 */
function createUvRegion(materialUvRegion: Uint16Array, indices: TypedArray): Uint16Array {
  const result = new Uint16Array(indices.length * 4);
  for (let i = 0; i < result.length; i += 4) {
    result.set(materialUvRegion, i);
  }
  return result;
}

/**
 * Flatten batchedIds list based on indices to right ordered array, compatible with i3s
 * @param batchedIds - gltf primitive
 * @param indices - gltf primitive indices
 * @returns flattened batch ids
 */
function flattenBatchIds(batchedIds: NumberArray, indices: TypedArray): number[] {
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
 * @param attributes - gltf accessors
 * @param primitive - gltf primitive data
 * @param images - gltf texture images
 * @param featureTexture - feature texture key
 * @return batch IDs
 */
function getBatchIds(
  attributes: {
    [key: string]: GLTFAccessorPostprocessed;
  },
  primitive: GLTFMeshPrimitivePostprocessed,
  images: (TextureImageProperties | null)[],
  featureTexture: string | null
): NumberArray {
  const batchIds: NumberArray = handleBatchIdsExtensions(
    attributes,
    primitive,
    images,
    featureTexture
  );

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
 * @param shouldMergeMaterials - if true - the converter will try to merge similar materials
 *                               to be able to merge primitives having those materials
 * @returns Array of Couples I3SMaterialDefinition + texture content
 */
async function convertMaterials(
  sourceMaterials: GLTFMaterialPostprocessed[] = [],
  shouldMergeMaterials: boolean
): Promise<I3SMaterialWithTexture[]> {
  let materials: I3SMaterialWithTexture[] = [];
  for (const sourceMaterial of sourceMaterials) {
    materials.push(convertMaterial(sourceMaterial));
  }

  if (shouldMergeMaterials) {
    materials = await mergeAllMaterials(materials);
  }

  return materials;
}

/**
 * Merge materials when possible
 * @param materials materials array
 * @returns merged materials array
 */
async function mergeAllMaterials(
  materials: I3SMaterialWithTexture[]
): Promise<I3SMaterialWithTexture[]> {
  const result: I3SMaterialWithTexture[] = [];
  while (materials.length > 0) {
    let newMaterial = materials.splice(0, 1)[0];
    const mergedIndices: number[] = [];
    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      if (
        (newMaterial.texture && material.texture) ||
        (!newMaterial.texture && !material.texture)
      ) {
        newMaterial = await mergeMaterials(newMaterial, material);
        mergedIndices.push(i);
      }
    }
    if (newMaterial.texture && mergedIndices.length) {
      const newWidth = newMaterial.mergedMaterials?.reduce(
        (accum, {textureSize}) => accum + (textureSize?.width || 0),
        0
      );
      const newHeight = newMaterial.mergedMaterials?.reduce(
        (accum, {textureSize}) => Math.max(accum, textureSize?.height || 0),
        0
      );
      let currentX = -1;
      for (const aTextureMetadata of newMaterial.mergedMaterials) {
        if (aTextureMetadata.textureSize) {
          const newX =
            currentX +
            1 +
            (aTextureMetadata.textureSize.width / newWidth) *
              2 ** (Uint16Array.BYTES_PER_ELEMENT * 8) -
            1;
          aTextureMetadata.uvRegion = new Uint16Array([
            currentX + 1,
            0,
            newX,
            (aTextureMetadata.textureSize.height / newHeight) *
              2 ** (Uint16Array.BYTES_PER_ELEMENT * 8) -
              1
          ]);
          currentX = newX;
        }
      }

      newMaterial.texture.image.width = newWidth;
      newMaterial.texture.image.height = newHeight;
    }
    for (const index of mergedIndices.reverse()) {
      materials.splice(index, 1);
    }
    result.push(newMaterial);
  }

  if (!result.length) {
    result.push({
      material: getDefaultMaterial(),
      mergedMaterials: [{originalMaterialId: 'default'}]
    });
  }
  return result;
}

/**
 * Merge 2 materials including texture
 * @param material1
 * @param material2
 * @returns
 */
async function mergeMaterials(
  material1: I3SMaterialWithTexture,
  material2: I3SMaterialWithTexture
): Promise<I3SMaterialWithTexture> {
  if (
    material1.texture?.bufferView &&
    material2.texture?.bufferView &&
    material1.mergedMaterials &&
    material2.mergedMaterials
  ) {
    const buffer1 = Buffer.from(material1.texture.bufferView.data);
    const buffer2 = Buffer.from(material2.texture.bufferView.data);
    try {
      // @ts-ignore
      const {joinImages} = await import('join-images');
      const sharpData = await joinImages([buffer1, buffer2], {direction: 'horizontal'});
      material1.texture.bufferView.data = await sharpData
        .toFormat(material1.texture.mimeType === 'image/png' ? 'png' : 'jpeg')
        .toBuffer();
    } catch (error) {
      console.log(
        'Join images into a texture atlas has failed. Consider usage `--split-nodes` option. (See documentation https://loaders.gl/modules/tile-converter/docs/cli-reference/tile-converter)'
      );
      throw error;
    }
    // @ts-ignore
    material1.material.pbrMetallicRoughness.baseColorTexture.textureSetDefinitionId = 1;
  }
  material1.mergedMaterials = material1.mergedMaterials.concat(material2.mergedMaterials);
  return material1;
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

  sourceMaterial.id = Number.isFinite(sourceMaterial.id) ? sourceMaterial.id : uuidv4();
  let mergedMaterials: MergedMaterial[] = [{originalMaterialId: sourceMaterial.id}];
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
  } else {
    mergedMaterials[0].textureSize = {width: texture.image.width, height: texture.image.height};
  }

  return {material, texture, mergedMaterials};
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
      // @ts-expect-error NumericArray
      diffuse: diffuse.toArray(),
      // @ts-expect-error NumericArray
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
        length: texture.source?.image.data.length ? [texture.source?.image.data.length] : undefined
      }
    ]
  };
}

/**
 * Formula for calculating imageId:
 * https://github.com/Esri/i3s-spec/blob/0a6366a9249b831db8436c322f8d27521e86cf07/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md#generating-image-ids
 * @param texture - texture image info
 * @param nodeId - I3S node ID
 * @returns calculate image ID according to the spec
 */
function generateImageId(texture: GLTFTexturePostprocessed, nodeId: number) {
  const {width, height} = texture.source?.image || {};
  if (!width || !height) {
    return '';
  }
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
 * @returns propertyTable indices to map featureIds
 */
function makeFeatureIdsUnique(
  featureIds: number[],
  featureIndices: number[],
  featuresHashArray: string[],
  batchTable: {[key: string]: any}
): Record<string, number> {
  const replaceMap = getFeaturesReplaceMap(featureIds, batchTable, featuresHashArray);
  replaceIndicesByUnique(featureIndices, replaceMap);
  replaceIndicesByUnique(featureIds, replaceMap);
  return replaceMap;
}

/**
 * Generate replace map to make featureIds unique.
 * @param featureIds
 * @param batchTable
 * @param featuresHashArray
 * @returns
 */
function getFeaturesReplaceMap(
  featureIds: any[],
  batchTable: object,
  featuresHashArray: any[]
): Record<string, number> {
  const featureMap: Record<string, number> = {};

  for (let index = 0; index < featureIds.length; index++) {
    const oldFeatureId = featureIds[index];
    const uniqueFeatureId = getOrCreateUniqueFeatureId(index, batchTable, featuresHashArray);
    featureMap[oldFeatureId.toString()] = uniqueFeatureId;
  }

  return featureMap;
}

/**
 * Generates string for unique batch id creation.
 * @param batchTable
 * @param index
 * @returns
 */
function generateStringFromBatchTableByIndex(batchTable: object, index: number): string {
  let str = '';
  for (const key in batchTable) {
    str += batchTable[key][index];
  }
  return str;
}

/**
 * Return already exited featureId or creates and returns new to support unique feature ids throw nodes.
 * @param index
 * @param batchTable
 * @param featuresHashArray
 * @returns
 */
function getOrCreateUniqueFeatureId(
  index: number,
  batchTable: object,
  featuresHashArray: any[]
): number {
  const batchTableStr = generateStringFromBatchTableByIndex(batchTable, index);
  const hash = md5(batchTableStr);

  if (featuresHashArray.includes(hash)) {
    return featuresHashArray.indexOf(hash);
  }
  return featuresHashArray.push(hash) - 1;
}

/**
 * Do replacement of indices for making them unique through all nodes.
 * @param indicesArray
 * @param featureMap
 * @returns
 */
function replaceIndicesByUnique(indicesArray: number[], featureMap: Record<string, number>) {
  for (let index = 0; index < indicesArray.length; index++) {
    indicesArray[index] = featureMap[indicesArray[index]];
  }
}

/**
 * Convert property table data to attribute buffers.
 * @param featureIds
 * @param propertyTable - table with metadata for particular feature.
 * @param attributeStorageInfo
 * @returns - Array of file buffers.
 */
function convertPropertyTableToAttributeBuffers(
  featureIds: number[],
  featureIdsMap: Record<string, number>,
  propertyTable: FeatureTableJson,
  attributeStorageInfo: AttributeStorageInfo[]
): any[] {
  const attributeBuffers: ArrayBuffer[] = [];

  const needFlattenPropertyTable = checkPropertiesLength(featureIds, propertyTable);
  const properties = needFlattenPropertyTable
    ? flattenPropertyTableByFeatureIds(featureIdsMap, propertyTable)
    : propertyTable;

  const propertyTableWithObjectIds = {
    OBJECTID: featureIds,
    ...properties
  };

  for (const propertyName in propertyTableWithObjectIds) {
    const type = getAttributeType(propertyName, attributeStorageInfo);
    if (type) {
      const value = propertyTableWithObjectIds[propertyName];
      const attributeBuffer = generateAttributeBuffer(type, value);

      attributeBuffers.push(attributeBuffer);
    }
  }

  return attributeBuffers;
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
 * @param key
 * @param attributeStorageInfo
 * @returns attribute type.
 */
function getAttributeType(key: string, attributeStorageInfo: any[]): string {
  const attribute = attributeStorageInfo.find((attr) => attr.name === key);
  if (!attribute) {
    console.error(
      `attribute is null, key=${key}, attributeStorageInfo=${JSON.stringify(
        attributeStorageInfo,
        null,
        2
      )}`
    );
    return '';
  }
  if (!attribute.attributeValues) {
    console.error(`attributeValues is null, attribute=${attribute}`);
    return '';
  }
  return attribute.attributeValues.valueType;
}

/**
 * Convert short integer to attribute arrayBuffer.
 * @param featureIds
 * @returns - Buffer with objectId data.
 */
function generateShortIntegerAttributeBuffer(featureIds: any[]): ArrayBuffer {
  const count = new Uint32Array([featureIds.length]);
  const valuesArray = new Uint32Array(featureIds);
  return concatenateArrayBuffers(count.buffer, valuesArray.buffer);
}

/**
 * Convert double to attribute arrayBuffer.
 * @param featureIds
 * @returns - Buffer with objectId data.
 */
function generateDoubleAttributeBuffer(featureIds: any[]): ArrayBuffer {
  const count = new Uint32Array([featureIds.length]);
  const padding = new Uint8Array(4);
  const valuesArray = new Float64Array(featureIds);

  return concatenateArrayBuffers(count.buffer, padding.buffer, valuesArray.buffer);
}

/**
 * Convert batch table attributes to array buffer with batch table data.
 * @param batchAttributes
 * @returns - Buffer with batch table data.
 */
function generateStringAttributeBuffer(batchAttributes: any[]): ArrayBuffer {
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
 * @param featureIds
 * @returns - Array of feature ids in BigUint64 format.
 */
function generateBigUint64Array(featureIds: any[]): BigUint64Array {
  const typedFeatureIds = new BigUint64Array(featureIds.length);
  for (let index = 0; index < featureIds.length; index++) {
    typedFeatureIds[index] = BigInt(featureIds[index]);
  }
  return typedFeatureIds;
}

/**
 * Generates draco compressed geometry
 * @param vertexCount
 * @param convertedAttributes - get rid of this argument here
 * @param attributes - geometry attributes to compress
 * @param libraries - dynamicaly loaded 3rd-party libraries
 * @returns - Compressed geometry.
 */
async function generateCompressedGeometry(
  vertexCount: number,
  convertedAttributes: Record<string, any>,
  attributes: Record<string, any>,
  libraries: Record<string, string>
): Promise<ArrayBuffer> {
  const {positions, normals, texCoords, colors, uvRegions, featureIds, faceRange} = attributes;
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
    'uv-region'?: TypedArray;
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

  if (uvRegions.length) {
    compressedAttributes['uv-region'] = uvRegions;
    attributesMetadata['uv-region'] = {
      'i3s-attribute-type': 'uv-region'
    };
  }

  return encode({attributes: compressedAttributes, indices}, DracoWriterWorker, {
    ...DracoWriterWorker.options,
    reuseWorkers: true,
    _nodeWorkers: true,
    modules: libraries,
    useLocalLibraries: true,
    draco: {
      method: 'MESH_SEQUENTIAL_ENCODING',
      attributesMetadata
    },
    ['draco-writer']: {
      // We need to load local fs workers because nodejs can't load workers from the Internet
      workerUrl: './modules/draco/dist/draco-writer-worker-node.js'
    }
  });
}

/**
 * Generates ordered feature indices based on face range
 * @param featureIndex
 * @param faceRange
 * @returns
 */
function generateFeatureIndexAttribute(
  featureIndex: Uint32Array,
  faceRange: Uint32Array
): Uint32Array {
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

/**
 * Find property table in tile
 * For example it can be batchTable for b3dm files or property table in gLTF extension.
 * @param tileContent - 3DTiles tile content
 * @param metadataClass - user selected feature metadata class name
 * @return batch table from b3dm / feature properties from EXT_FEATURE_METADATA, EXT_MESH_FEATURES or EXT_STRUCTURAL_METADATA
 */
export function getPropertyTable(
  tileContent: Tiles3DTileContent | null,
  metadataClass?: string
): FeatureTableJson | null {
  if (!tileContent) {
    return null;
  }
  let propertyTable: FeatureTableJson | null;
  const batchTableJson = tileContent?.batchTableJson;

  if (batchTableJson) {
    return batchTableJson;
  }

  const {extensionName, extension} = getPropertyTableExtension(tileContent);

  switch (extensionName) {
    case EXT_MESH_FEATURES: {
      propertyTable = getPropertyTableFromExtMeshFeatures(
        extension as GLTF_EXT_mesh_features,
        metadataClass
      );
      return propertyTable;
    }
    case EXT_STRUCTURAL_METADATA: {
      propertyTable = getPropertyTableFromExtStructuralMetadata(
        extension as GLTF_EXT_structural_metadata,
        metadataClass
      );
      return propertyTable;
    }
    case EXT_FEATURE_METADATA: {
      propertyTable = getPropertyTableFromExtFeatureMetadata(
        extension as GLTF_EXT_feature_metadata_GLTF,
        metadataClass
      );
      return propertyTable;
    }
    default:
      return null;
  }
}

/**
 * Check extensions which can be with property table inside.
 * @param tileContent - 3DTiles tile content
 */
function getPropertyTableExtension(tileContent: Tiles3DTileContent): {
  extensionName: null | string;
  extension:
    | string
    | GLTF_EXT_feature_metadata_GLTF
    | GLTF_EXT_structural_metadata
    | GLTF_EXT_mesh_features
    | null;
} {
  const extensionsWithPropertyTables = [
    EXT_FEATURE_METADATA,
    EXT_STRUCTURAL_METADATA,
    EXT_MESH_FEATURES
  ];
  const extensionsUsed = tileContent?.gltf?.extensionsUsed;

  if (!extensionsUsed) {
    return {extensionName: null, extension: null};
  }

  let extensionName: string = '';
  for (const extensionItem of tileContent?.gltf?.extensionsUsed || []) {
    if (extensionsWithPropertyTables.includes(extensionItem)) {
      extensionName = extensionItem;
      break;
    }
  }

  if (!extensionName) {
    return {extensionName: null, extension: null};
  }

  const extension = tileContent?.gltf?.extensions?.[extensionName] as
    | string // EXT_mesh_features doesn't have global metadata
    | GLTF_EXT_feature_metadata_GLTF;

  return {extensionName, extension};
}

/**
 * Handle EXT_feature_metadata to get property table
 * @param extension - global level of EXT_FEATURE_METADATA extension
 * @param metadataClass - user selected feature metadata class name
 * @returns {FeatureTableJson | null} Property table or null if the extension can't be handled properly.
 */
function getPropertyTableFromExtFeatureMetadata(
  extension: GLTF_EXT_feature_metadata_GLTF,
  metadataClass?: string
): FeatureTableJson | null {
  if (extension?.featureTables) {
    /**
     * Take only first feature table to generate attributes storage info object.
     * TODO: Think about getting data from all feature tables?
     * It can be tricky just because 3dTiles is able to have multiple featureId attributes and multiple feature tables.
     * In I3S we should decide which featureIds attribute will be passed to geometry data.
     */
    const firstFeatureTableName = Object.keys(extension.featureTables)?.[0];

    if (firstFeatureTableName) {
      const featureTable = extension?.featureTables[firstFeatureTableName];
      const propertyTable = {};

      for (const propertyName in featureTable.properties) {
        propertyTable[propertyName] = featureTable.properties[propertyName].data;
      }

      return propertyTable;
    }
  }

  if (extension?.featureTextures) {
    let featureTexture: string | undefined;
    for (const textureKey in extension.featureTextures) {
      const texture = extension.featureTextures[textureKey];
      if (texture.class === metadataClass) {
        featureTexture = textureKey;
      }
    }

    if (typeof featureTexture === 'string') {
      const featureTable = extension?.featureTextures[featureTexture];
      const propertyTable = {};

      for (const propertyName in featureTable.properties) {
        propertyTable[propertyName] = featureTable.properties[propertyName].data;
      }

      return propertyTable;
    }
  }

  console.warn(
    "The I3S converter couldn't handle EXT_feature_metadata extension: There is neither featureTables, no featureTextures in the extension."
  );
  return null;
}

/**
 * Handle EXT_structural_metadata to get property table
 * @param extension - global level of EXT_STRUCTURAL_METADATA extension
 * @param metadataClass - user selected feature metadata class name
 * @returns {FeatureTableJson | null} Property table or null if the extension can't be handled properly.
 */
function getPropertyTableFromExtStructuralMetadata(
  extension: GLTF_EXT_structural_metadata,
  metadataClass?: string
): FeatureTableJson | null {
  if (extension?.propertyTables) {
    /**
     * Take only first feature table to generate attributes storage info object.
     * TODO: Think about getting data from all feature tables?
     * It can be tricky just because 3dTiles is able to have multiple featureId attributes and multiple feature tables.
     * In I3S we should decide which featureIds attribute will be passed to geometry data.
     */
    const firstPropertyTable = extension?.propertyTables[0];
    const propertyTableWithData = {};

    for (const propertyName in firstPropertyTable.properties) {
      propertyTableWithData[propertyName] = firstPropertyTable.properties[propertyName].data;
    }

    return propertyTableWithData;
  }

  if (extension?.propertyTextures) {
    /**
     * Take only first feature table to generate attributes storage info object.
     * TODO: Think about getting data from all feature tables?
     * It can be tricky just because 3dTiles is able to have multiple featureId attributes and multiple feature tables.
     * In I3S we should decide which featureIds attribute will be passed to geometry data.
     */
    if (extension?.propertyTextures) {
      const firstPropertyTexture = extension?.propertyTextures[0];
      const propertyTableWithData = {};

      for (const propertyName in firstPropertyTexture.properties) {
        propertyTableWithData[propertyName] = firstPropertyTexture.properties[propertyName].data;
      }

      return propertyTableWithData;
    }
  }

  console.warn(
    "The I3S converter couldn't handle EXT_structural_metadata extension: There is neither propertyTables, no propertyTextures in the extension."
  );
  return null;
}

/**
 * Handle EXT_mesh_features to get property table
 * @param extension - global level of EXT_MESH_FEATURES extension
 * @param metadataClass - user selected feature metadata class name
 * @returns {FeatureTableJson | null} Property table or null if the extension can't be handled properly.
 */
function getPropertyTableFromExtMeshFeatures(
  extension: GLTF_EXT_mesh_features,
  metadataClass?: string
): FeatureTableJson | null {
  if (extension?.featureIds) {
    const firstFeatureId = extension?.featureIds[0];
    const propertyTableWithData = {};

    // When firstFeatureId.propertyTable is defined, the property data will be taken from EXT_structural_metadata extension
    if (!firstFeatureId.propertyTable) {
      console.warn(
        'Should be implemented as we have the tileset with Ext_mesh_features not linked with EXT_structural_metadata extension'
      );
    }

    return propertyTableWithData;
  }

  console.warn(
    "The I3S converter couldn't handle EXT_mesh_features extension: There is no featureIds in the extension."
  );
  return null;
}
