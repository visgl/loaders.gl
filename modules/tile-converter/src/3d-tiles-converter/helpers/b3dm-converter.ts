import type {I3STileContent} from '@loaders.gl/i3s';
import {encodeSync} from '@loaders.gl/core';
import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
import {Tile3DWriter} from '@loaders.gl/3d-tiles';
import {Matrix4, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {convertTextureAtlas} from './texture-atlas';
import {generateSyntheticIndices} from '../../lib/utils/geometry-utils';

const Z_UP_TO_Y_UP_MATRIX = new Matrix4([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
const scratchVector = new Vector3();
const KHR_MATERIALS_UNLIT = 'KHR_materials_unlit';
const METALLIC_FACTOR_DEFAULT = 1.0;
const ROUGHNESS_FACTOR_DEFAULT = 1.0;

export type I3SAttributesData = {
  tileContent: I3STileContent;
  box: number[];
  textureFormat: string;
};

/**
 * Converts content of an I3S node to *.b3dm's file content
 */
export default class B3dmConverter {
  // @ts-expect-error
  rtcCenter: Float32Array;
  i3sTile: any;

  /**
   * The starter of content conversion
   * @param i3sTile - Tile3D instance for I3S node
   * @returns - encoded content
   */
  async convert(
    i3sAttributesData: I3SAttributesData,
    featureAttributes: any = null
  ): Promise<ArrayBuffer> {
    const gltf = await this.buildGLTF(i3sAttributesData, featureAttributes);
    const b3dm = encodeSync(
      {
        gltfEncoded: new Uint8Array(gltf),
        type: 'b3dm',
        featuresLength: this._getFeaturesLength(featureAttributes),
        batchTable: featureAttributes
      },
      Tile3DWriter
    );
    return b3dm;
  }

  /**
   * Build and encode gltf
   * @param i3sTile - Tile3D instance for I3S node
   * @returns - encoded glb content
   */
  // eslint-disable-next-line max-statements
  async buildGLTF(
    i3sAttributesData: I3SAttributesData,
    featureAttributes: any
  ): Promise<ArrayBuffer> {
    const {tileContent, textureFormat, box} = i3sAttributesData;
    const {material, attributes, indices: originalIndices, modelMatrix} = tileContent;
    const gltfBuilder = new GLTFScenegraph();

    const textureIndex = await this._addI3sTextureToGLTF(tileContent, textureFormat, gltfBuilder);

    // Add KHR_MATERIALS_UNLIT extension in the following cases:
    // - metallicFactor or roughnessFactor are set to default values
    // - metallicFactor or roughnessFactor are not set
    const pbrMetallicRoughness = material?.pbrMetallicRoughness;
    if (
      pbrMetallicRoughness &&
      (pbrMetallicRoughness.metallicFactor === undefined ||
        pbrMetallicRoughness.metallicFactor === METALLIC_FACTOR_DEFAULT) &&
      (pbrMetallicRoughness.roughnessFactor === undefined ||
        pbrMetallicRoughness.roughnessFactor === ROUGHNESS_FACTOR_DEFAULT)
    ) {
      gltfBuilder.addObjectExtension(material, KHR_MATERIALS_UNLIT, {});
      gltfBuilder.addExtension(KHR_MATERIALS_UNLIT);
    }

    const pbrMaterialInfo = this._convertI3sMaterialToGLTFMaterial(material, textureIndex);
    const materialIndex = gltfBuilder.addMaterial(pbrMaterialInfo);

    const positions = attributes.positions;
    const positionsValue = positions.value;

    if (attributes.uvRegions && attributes.texCoords) {
      attributes.texCoords.value = convertTextureAtlas(
        attributes.texCoords.value,
        attributes.uvRegions.value
      );
    }

    const cartesianOrigin = new Vector3(box);
    const cartographicOrigin = Ellipsoid.WGS84.cartesianToCartographic(
      cartesianOrigin,
      new Vector3()
    );

    attributes.positions.value = this._normalizePositions(
      positionsValue,
      cartesianOrigin,
      cartographicOrigin,
      modelMatrix
    );
    this._createBatchIds(tileContent, featureAttributes);
    if (attributes.normals && !this._checkNormals(attributes.normals.value)) {
      delete attributes.normals;
    }
    const indices =
      originalIndices || generateSyntheticIndices(positionsValue.length / positions.size);
    const meshIndex = gltfBuilder.addMesh({
      attributes,
      indices,
      material: materialIndex,
      mode: 4
    });
    const transformMatrix = this._generateTransformMatrix(cartesianOrigin);
    const nodeIndex = gltfBuilder.addNode({meshIndex, matrix: transformMatrix});
    const sceneIndex = gltfBuilder.addScene({nodeIndices: [nodeIndex]});
    gltfBuilder.setDefaultScene(sceneIndex);

    gltfBuilder.createBinaryChunk();

    const gltfBuffer = encodeSync(gltfBuilder.gltf, GLTFWriter);

    return gltfBuffer;
  }

  /**
   * Update gltfBuilder with texture from I3S tile
   * @param {object} i3sTile - Tile3D object
   * @param {GLTFScenegraph} gltfBuilder - gltfScenegraph instance to construct GLTF
   * @returns {Promise<number | null>} - GLTF texture index
   */
  async _addI3sTextureToGLTF(tileContent, textureFormat, gltfBuilder) {
    const {texture, material, attributes} = tileContent;
    let textureIndex = null;
    let selectedTexture = texture;
    if (!texture && material) {
      selectedTexture =
        material.pbrMetallicRoughness &&
        material.pbrMetallicRoughness.baseColorTexture &&
        material.pbrMetallicRoughness.baseColorTexture.texture.source.image;
    }
    if (selectedTexture) {
      const mimeType = this._deduceMimeTypeFromFormat(textureFormat);
      const imageIndex = gltfBuilder.addImage(selectedTexture, mimeType);
      textureIndex = gltfBuilder.addTexture({imageIndex});
      delete attributes.colors;
    }
    return textureIndex;
  }

  /**
   * Generate a positions array which is correct for 3DTiles/GLTF format
   * @param {Float64Array} positionsValue - the input geometry positions array
   * @param {number[]} cartesianOrigin - the tile center in the cartesian coordinate system
   * @param {number[]} cartographicOrigin - the tile center in the cartographic coordinate system
   * @param {number[]} modelMatrix - the model matrix of geometry
   * @returns {Float32Array} - the output geometry positions array
   */
  _normalizePositions(positionsValue, cartesianOrigin, cartographicOrigin, modelMatrix) {
    const newPositionsValue = new Float32Array(positionsValue.length);
    for (let index = 0; index < positionsValue.length; index += 3) {
      const vertex = positionsValue.subarray(index, index + 3);
      const cartesianOriginVector = new Vector3(cartesianOrigin);
      let vertexVector = new Vector3(Array.from(vertex))
        .transform(modelMatrix)
        .add(cartographicOrigin);
      Ellipsoid.WGS84.cartographicToCartesian(vertexVector, scratchVector);
      vertexVector = scratchVector.subtract(cartesianOriginVector);
      newPositionsValue.set(vertexVector, index);
    }
    return newPositionsValue;
  }

  /**
   * Generate the transformation matrix for GLTF node:
   * https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#reference-node
   * 1. Create the translate transformation from cartesianOrigin (the positions array stores offsets from this cartesianOrigin)
   * 2. Create the rotation transformation to rotate model from z-up coordinates (I3S specific) to y-up coordinates (GLTF specific)
   * @param {number[]} cartesianOrigin - the tile center in the cartesian coordinate system
   * @returns {Matrix4} - an array of 16 numbers (4x4 matrix)
   */
  _generateTransformMatrix(cartesianOrigin) {
    const translateOriginMatrix = new Matrix4().translate(cartesianOrigin);
    const result = translateOriginMatrix.multiplyLeft(Z_UP_TO_Y_UP_MATRIX);
    return result;
  }

  /**
   * Create _BATCHID attribute
   * @param {Object} i3sContent - the source object
   * @returns {void}
   */
  _createBatchIds(i3sContent, featureAttributes) {
    const {featureIds} = i3sContent;
    const {OBJECTID: objectIds} = featureAttributes || {};
    if (!featureIds || !objectIds) {
      return;
    }

    for (let i = 0; i < featureIds.length; i++) {
      const featureId = featureIds[i];
      const batchId = objectIds.indexOf(featureId);
      featureIds[i] = batchId;
    }

    i3sContent.attributes._BATCHID = {
      size: 1,
      byteOffset: 0,
      value: featureIds
    };
  }

  /**
   * Deduce mime type by format from `textureSetDefinition.formats[0].format`
   * https://github.com/Esri/i3s-spec/blob/master/docs/1.7/textureSetDefinitionFormat.cmn.md
   * @param {string} format - format name
   * @returns {string} mime type.
   */
  _deduceMimeTypeFromFormat(format) {
    switch (format) {
      case 'jpg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'ktx2':
        return 'image/ktx2';
      default:
        console.warn(`Unexpected texture format in I3S: ${format}`); // eslint-disable-line no-console, no-undef
        return 'image/jpeg';
    }
  }

  /**
   * Convert i3s material to GLTF compatible material
   * @param {object} material - i3s material definition
   * @param {number | null} textureIndex - texture index in GLTF
   * @returns {object} GLTF material
   */
  _convertI3sMaterialToGLTFMaterial(material, textureIndex) {
    const isTextureIndexExists = textureIndex !== null;

    if (!material) {
      material = {
        alphaMode: 'OPAQUE',
        doubleSided: false,
        pbrMetallicRoughness: {
          metallicFactor: 0,
          roughnessFactor: 1
        }
      };

      if (isTextureIndexExists) {
        material.pbrMetallicRoughness.baseColorTexture = {
          index: textureIndex,
          texCoord: 0
        };
      } else {
        material.pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
      }

      return material;
    }

    if (textureIndex !== null) {
      material = this._setGLTFTexture(material, textureIndex);
    }

    return material;
  }

  /**
   * Set texture properties in material with GLTF textureIndex
   * @param {object} materialDefinition - i3s material definition
   * @param {number} textureIndex - texture index in GLTF
   * @returns {void}
   */
  _setGLTFTexture(materialDefinition, textureIndex) {
    const material = {
      ...materialDefinition,
      pbrMetallicRoughness: {...materialDefinition.pbrMetallicRoughness}
    };
    // I3SLoader now support loading only one texture. This elseif sequence will assign this texture to one of
    // properties defined in materialDefinition
    if (
      materialDefinition.pbrMetallicRoughness &&
      materialDefinition.pbrMetallicRoughness.baseColorTexture
    ) {
      material.pbrMetallicRoughness.baseColorTexture = {
        index: textureIndex,
        texCoord: 0
      };
    } else if (materialDefinition.emissiveTexture) {
      material.emissiveTexture = {
        index: textureIndex,
        texCoord: 0
      };
    } else if (
      materialDefinition.pbrMetallicRoughness &&
      materialDefinition.pbrMetallicRoughness.metallicRoughnessTexture
    ) {
      material.pbrMetallicRoughness.metallicRoughnessTexture = {
        index: textureIndex,
        texCoord: 0
      };
    } else if (materialDefinition.normalTexture) {
      material.normalTexture = {
        index: textureIndex,
        texCoord: 0
      };
    } else if (materialDefinition.occlusionTexture) {
      material.occlusionTexture = {
        index: textureIndex,
        texCoord: 0
      };
    }
    return material;
  }

  /*
   * Returns Features length based on attribute array in attribute object.
   * @param {Object} attributes
   * @returns {Number} Features length .
   */
  _getFeaturesLength(attributes) {
    if (!attributes) {
      return 0;
    }
    const firstKey = Object.keys(attributes)[0];
    return firstKey ? attributes[firstKey].length : 0;
  }

  /* Checks that normals buffer is correct
   * @param {TypedArray} normals
   * @returns {boolean} true - normals are correct; false - normals are incorrect
   */
  _checkNormals(normals) {
    // If all normals === 0, the resulting tileset is all in black colors on Cesium
    return normals.find((value) => value);
  }
}
