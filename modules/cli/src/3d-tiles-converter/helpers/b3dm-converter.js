import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';

export default class B3dmConverter {
  constructor() {
    // TODO: Save this data in featureTable.RTC_CENTER
    this.rtcCenter = new Float32Array(3);
  }

  convert(i3sContent) {
    this.i3sContent = i3sContent;
    const gltf = this.buildGltf(i3sContent);
    return gltf;
  }

  buildGltf(i3sContent) {
    const gltfBuilder = new GLTFScenegraph();

    // Create RTC_CENTER for positions and shrink positions to Float32Array instead of Float64Array
    const positions = i3sContent.attributes.positions.value;
    this.rtcCenter[0] = this._axisAvg(positions, 0);
    this.rtcCenter[1] = this._axisAvg(positions, 1);
    this.rtcCenter[2] = this._axisAvg(positions, 2);
    i3sContent.attributes.positions.value = this._shrinkPositions(positions);

    const meshIndex = gltfBuilder.addMesh(i3sContent.attributes);
    const nodeIndex = gltfBuilder.addNode(meshIndex);
    const sceneIndex = gltfBuilder.addScene([nodeIndex]);
    gltfBuilder.setDefaultScene(sceneIndex);

    // TODO: Convert mime data from `layers/0`.`textureSetDefinitions`
    const imageIndex = gltfBuilder.addImage(i3sContent.texture.data, 'image/jpeg');
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

  _shrinkPositions(positions) {
    const newPositions = new Float32Array(positions.length);
    for (let index = 0; index < positions.length; index += 3) {
      newPositions[index] = positions[index] - this.rtcCenter[0];
      newPositions[index + 1] = positions[index + 1] - this.rtcCenter[1];
      newPositions[index + 2] = positions[index + 2] - this.rtcCenter[2];
    }

    return newPositions;
  }

  // Weighted average
  _axisAvg(arr, axisNumber) {
    let result = 0;
    let currentWeight = 0;
    for (let index = axisNumber; index < arr.length; index += 3) {
      result = (result * currentWeight + arr[index]) / (currentWeight + 1);
      currentWeight++;
    }
    return result;
  }
}
