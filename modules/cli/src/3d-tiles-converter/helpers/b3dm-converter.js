import {encode} from '@loaders.gl/core';
import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
import {Tile3DWriter} from '@loaders.gl/3d-tiles';
import {ImageWriter} from '@loaders.gl/images';

export default class B3dmConverter {
  constructor() {
    // TODO: Save this data in featureTable.RTC_CENTER
    this.rtcCenter = new Float32Array(3);
  }

  async convert(i3sContent) {
    this.i3sContent = i3sContent;
    const gltf = await this.buildGltf(i3sContent);
    const b3dm = Tile3DWriter.encodeSync({
      gltfEncoded: new Uint8Array(gltf),
      type: 'b3dm',
      featuresLength: 0
    });
    return b3dm;
  }

  async buildGltf(i3sContent) {
    const gltfBuilder = new GLTFScenegraph();

    // Create RTC_CENTER for positions and shrink positions to Float32Array instead of Float64Array
    const positions = i3sContent.attributes.positions.value;
    this.rtcCenter[0] = this._axisAvg(positions, 0);
    this.rtcCenter[1] = this._axisAvg(positions, 1);
    this.rtcCenter[2] = this._axisAvg(positions, 2);
    i3sContent.attributes.positions.value = new Float32Array(positions); // this._shrinkPositions(positions);
    this._replaceFeatureIdsAndFaceRangeWithBatchId(i3sContent);

    const meshIndex = gltfBuilder.addMesh(i3sContent.attributes);
    const nodeIndex = gltfBuilder.addNode(meshIndex);
    const sceneIndex = gltfBuilder.addScene([nodeIndex]);
    gltfBuilder.setDefaultScene(sceneIndex);

    // TODO: Convert mime data from `layers/0`.`textureSetDefinitions`
    const imageBuffer = await encode(i3sContent.texture, ImageWriter);
    const imageIndex = gltfBuilder.addImage(imageBuffer, 'image/jpeg');
    const textureIndex = gltfBuilder.addTexture(imageIndex);
    // TODO: Convert material data from `layers/0`.`materialDefinitions`
    const pbrMaterialInfo = {
      pbrMetallicRoughness: {
        baseColorTexture: textureIndex
      }
    };
    gltfBuilder.addMaterial(pbrMaterialInfo);

    gltfBuilder.createBinaryChunk();

    const gltfBuffer = GLTFWriter.encodeSync({
      json: gltfBuilder.json,
      binary: gltfBuilder.arrayBuffer
    });

    return gltfBuffer;
  }
  /**
   * Positions in I3S are represented in Float64Array.
   * GLTF doesn't have component type for Float64Array
   * This method deduce the `rtcCenter` vector and subtract it from each vertex
   * After this operation positions array is converted to Float32Array
   * @param {Float64Array} positions - the source array of positions
   * @returns {Float32Array} - The converted positions array
   */
  _shrinkPositions(positions) {
    const newPositions = new Float32Array(positions.length);
    for (let index = 0; index < positions.length; index += 3) {
      newPositions[index] = positions[index] - this.rtcCenter[0];
      newPositions[index + 1] = positions[index + 1] - this.rtcCenter[1];
      newPositions[index + 2] = positions[index + 2] - this.rtcCenter[2];
    }

    return newPositions;
  }
  /**
   * Calculate average positions value for some particular axis (x, y, z)
   * Weighted average
   * @param {Array} arr - the source array
   * @param {Number} axisNumber - number of an axis. Possible values are 0, 1 or 2
   * @returns {Number} - The average value for some axis
   */
  _axisAvg(arr, axisNumber) {
    let result = 0;
    let currentWeight = 0;
    for (let index = axisNumber; index < arr.length; index += 3) {
      result = (result * currentWeight + arr[index]) / (currentWeight + 1);
      currentWeight++;
    }
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
    const batchId = this._generateBatchId(faceRanges, featureIds);

    i3sContent.attributes._BATCHID = {
      ...i3sContent.attributes.featureIds,
      value: batchId
    };
    delete i3sContent.attributes.faceRange;
    delete i3sContent.attributes.featureIds;
  }
  /**
   * Generate batchId attribute from featureIds and faceRanges.
   * @param {Uint32Array} faceRanges - the source array
   * @param {Object} featureIds - Object with featureIds list
   * @returns {Float64Array} batchId list.
   */
  _generateBatchId(faceRanges, featureIds) {
    const batchIdArraySize = faceRanges[faceRanges.length - 1] + 1;
    const batchId = new Float64Array(batchIdArraySize);
    let rangeIndex = 0;

    for (let index = 0; index < faceRanges.length / 2; index++) {
      const fromIndex = faceRanges[rangeIndex];
      const untilPosition = faceRanges[rangeIndex + 1] + 1;
      const featureId = featureIds.value[index];

      batchId.fill(featureId, fromIndex, untilPosition);
      rangeIndex += 2;
    }
    return batchId;
  }
}
