import {encode, encodeSync} from '@loaders.gl/core';
import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
import {Tile3DWriter} from '@loaders.gl/3d-tiles';
import {ImageWriter} from '@loaders.gl/images';
import {Matrix4, Vector3} from '@math.gl/core';

const Z_UP_TO_Y_UP_MATRIX = new Matrix4([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);

export default class B3dmConverter {
  async convert(i3sTile, attributes = null) {
    this.i3sTile = i3sTile;
    const gltf = await this.buildGltf(i3sTile);
    const b3dm = encodeSync(
      {
        gltfEncoded: new Uint8Array(gltf),
        type: 'b3dm',
        featuresLength: this._getFeaturesLength(attributes),
        batchTable: attributes
      },
      Tile3DWriter
    );
    return b3dm;
  }

  async buildGltf(i3sTile) {
    const i3sContent = i3sTile.content;
    const gltfBuilder = new GLTFScenegraph();

    const textureIndex = await this._addI3sTextureToGltf(i3sTile, gltfBuilder);
    const pbrMaterialInfo = this._convertI3sMaterialToGltfMaterial(
      i3sContent.material,
      textureIndex
    );
    const materialIndex = gltfBuilder.addMaterial(pbrMaterialInfo);

    const positions = i3sContent.attributes.positions;
    const positionsValue = positions.value;
    i3sContent.attributes.positions.value = this._normalizePositions(
      positionsValue,
      i3sContent.cartesianOrigin
    );
    this._replaceFeatureIdsAndFaceRangeWithBatchId(i3sContent);
    if (i3sContent.attributes.normals && !this._checkNormals(i3sContent.attributes.normals.value)) {
      delete i3sContent.attributes.normals;
    }
    const indices = this._generateSynteticIndices(positionsValue.length / positions.size);
    const meshIndex = gltfBuilder.addMesh({
      attributes: i3sContent.attributes,
      indices,
      material: materialIndex
    });
    const transformMatrix = this._generateTransformMatrix(i3sContent.cartesianOrigin);
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
  async _addI3sTextureToGltf(i3sTile, gltfBuilder) {
    const i3sContent = i3sTile.content;
    let textureIndex = null;
    if (i3sContent.texture) {
      const mimeType = this._deduceMimeTypeFromFormat(i3sTile.header.textureFormat);
      const imageBuffer = await encode(i3sContent.texture, ImageWriter);
      const imageIndex = gltfBuilder.addImage(imageBuffer, mimeType);
      textureIndex = gltfBuilder.addTexture({imageIndex});
      delete i3sContent.attributes.colors;
    }
    return textureIndex;
  }

  /**
   * Generate a positions array which is correct for 3DTiles/GLTF format
   * @param {Float64Array} positionsValue - the input geometry positions array
   * @param {number[]} cartesianOrigin - the tile center in the cartesian coordinate system
   * @returns {Float32Array} - the output geometry positions array
   */
  _normalizePositions(positionsValue, cartesianOrigin) {
    const newPositionsValue = new Float32Array(positionsValue.length);
    for (let index = 0; index < positionsValue.length; index += 3) {
      const vertex = positionsValue.subarray(index, index + 3);
      const originVector = new Vector3(cartesianOrigin);
      let vertexVector = new Vector3(Array.from(vertex));
      vertexVector = vertexVector.subtract(originVector);
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
   * Do replacement featureIds and faseRange in i3sContent object.
   * @param {Object} i3sContent - the source object
   * @returns {void}
   */
  _replaceFeatureIdsAndFaceRangeWithBatchId(i3sContent) {
    const {featureIds, faceRange} = i3sContent.attributes;
    if (!featureIds || !faceRange) {
      return;
    }

    const faceRanges = faceRange.value;
    const batchId = this._generateBatchId(faceRanges);

    i3sContent.attributes._BATCHID = {
      ...i3sContent.attributes.featureIds,
      value: batchId
    };
    delete i3sContent.attributes.faceRange;
    delete i3sContent.attributes.featureIds;
  }

  /**
   * Generate batchId attribute from faceRanges.
   * @param {Uint32Array} faceRanges - the source array
   * @returns {Float32Array} batchId list.
   */
  _generateBatchId(faceRanges) {
    const batchIdArraySize = (faceRanges[faceRanges.length - 1] + 1) * 3;
    const batchId = new Float32Array(batchIdArraySize);
    let rangeIndex = 0;
    let currentBatchId = 0;

    for (let index = 0; index < faceRanges.length / 2; index++) {
      const fromIndex = faceRanges[rangeIndex] * 3;
      const untilPosition = (faceRanges[rangeIndex + 1] + 1) * 3;

      batchId.fill(currentBatchId, fromIndex, untilPosition);
      rangeIndex += 2;
      currentBatchId += 1;
    }
    return batchId;
  }

  /**
   * luma.gl can not work without indices now:
   * https://github.com/visgl/luma.gl/blob/d8cad75b9f8ca3e578cf078ed9d19e619c2ddbc9/modules/experimental/src/gltf/gltf-instantiator.js#L115
   * This method generates syntetic indices array: [0, 1, 2, 3, .... , vertexCount-1]
   * @param {number} vertexCount - vertex count in the geometry
   * @returns {Uint32Array} indices array.
   */
  _generateSynteticIndices(vertexCount) {
    const result = new Uint32Array(vertexCount);
    for (let index = 0; index < vertexCount; index++) {
      result.set([index], index);
    }
    return result;
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
  _convertI3sMaterialToGltfMaterial(material, textureIndex) {
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
      this._setGltfTexture(material, textureIndex);
    }

    return material;
  }

  /**
   * Set texture properties in material with GLTF textureIndex
   * @param {object} materialDefinition - i3s material definition
   * @param {number} textureIndex - texture index in GLTF
   * @returns {void}
   */
  _setGltfTexture(materialDefinition, textureIndex) {
    // I3SLoader now support loading only one texture. This elseif sequence will assign this texture to one of
    // properties defined in materialDefinition
    if (
      materialDefinition.pbrMetallicRoughness &&
      materialDefinition.pbrMetallicRoughness.baseColorTexture
    ) {
      materialDefinition.pbrMetallicRoughness.baseColorTexture = {
        index: textureIndex,
        texCoord: 0
      };
    } else if (materialDefinition.emissiveTexture) {
      materialDefinition.emissiveTexture = {
        index: textureIndex,
        texCoord: 0
      };
    } else if (
      materialDefinition.pbrMetallicRoughness &&
      materialDefinition.pbrMetallicRoughness.metallicRoughnessTexture
    ) {
      materialDefinition.pbrMetallicRoughness.metallicRoughnessTexture = {
        index: textureIndex,
        texCoord: 0
      };
    } else if (materialDefinition.normalTexture) {
      materialDefinition.normalTexture = {
        index: textureIndex,
        texCoord: 0
      };
    } else if (materialDefinition.occlusionTexture) {
      materialDefinition.occlusionTexture = {
        index: textureIndex,
        texCoord: 0
      };
    }
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
    return attributes[firstKey].length;
  }

  /* Checks that normals buffer is correct
   * @param {TypedArray} normals
   * @returns {boolean} true - normals are correct; false - normals are incorrect
   */
  _checkNormals(normals) {
    // If all normals === 0, the resulting tileset is all in black colors on Cesium
    return normals.find(value => value);
  }
}
