import {encode} from '@loaders.gl/core';
import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';
import {Tile3DWriter} from '@loaders.gl/3d-tiles';
import {ImageWriter} from '@loaders.gl/images';
import {Matrix4, Vector3} from '@math.gl/core';

export default class B3dmConverter {
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

    // TODO: Convert mime data from `layers/0`.`textureSetDefinitions`
    const imageBuffer = await encode(i3sContent.texture, ImageWriter);
    const imageIndex = gltfBuilder.addImage(imageBuffer, 'image/jpeg');
    const textureIndex = gltfBuilder.addTexture(imageIndex);
    // TODO: Convert material data from `layers/0`.`materialDefinitions`
    const pbrMaterialInfo = {
      alphaMode: 'OPAQUE',
      doubleSided: false,
      pbrMetallicRoughness: {
        baseColorTexture: {
          index: textureIndex,
          texCoord: 0
        },
        metallicFactor: 0,
        roughnessFactor: 1
      }
    };
    const materialIndex = gltfBuilder.addMaterial(pbrMaterialInfo);

    const positions = i3sContent.attributes.positions;
    const positionsValue = positions.value;
    i3sContent.attributes.positions.value = this._normalizePositions(
      positionsValue,
      i3sContent.cartesianOrigin
    );
    this._replaceFeatureIdsAndFaceRangeWithBatchId(i3sContent);
    delete i3sContent.attributes.colors;
    const indices = this._generateSynteticIndices(positionsValue.length / positions.size);
    const meshIndex = gltfBuilder.addMesh(i3sContent.attributes, indices, materialIndex);
    const transformMatrix = this._generateTransformMatrix(i3sContent.cartesianOrigin);
    const nodeIndex = gltfBuilder.addNode(meshIndex, transformMatrix.toArray());
    const sceneIndex = gltfBuilder.addScene([nodeIndex]);
    gltfBuilder.setDefaultScene(sceneIndex);

    gltfBuilder.createBinaryChunk();

    const gltfBuffer = GLTFWriter.encodeSync(gltfBuilder.gltf);

    return gltfBuffer;
  }

  _normalizePositions(positionsValue, cartesianOrigin) {
    const newPositionsValue = new Float32Array(positionsValue.length);
    for (let index = 0; index < positionsValue.length; index += 3) {
      const vertex = positionsValue.subarray(index, index + 3);
      const originVector = new Vector3(cartesianOrigin);
      let vertexVector = new Vector3(Array.from(vertex));
      vertexVector = vertexVector.subtract(originVector);
      newPositionsValue.set(vertexVector.toArray(), index);
    }
    return newPositionsValue;
  }

  _generateTransformMatrix(cartesianOrigin) {
    const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const translateOriginMatrix = new Matrix4(IDENTITY).translate(cartesianOrigin);
    const zUpToYUpMatrix = new Matrix4([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
    const result = translateOriginMatrix.multiplyLeft(zUpToYUpMatrix);
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
   * @returns {Float32Array} batchId list.
   */
  _generateBatchId(faceRanges, featureIds) {
    const batchIdArraySize = faceRanges[faceRanges.length - 1] + 1;
    const batchId = new Float32Array(batchIdArraySize);
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

  _generateSynteticIndices(vertexCount) {
    const result = new Uint32Array(vertexCount);
    for (let index = 0; index < vertexCount; index++) {
      result.set([index], index);
    }
    return result;
  }
}
