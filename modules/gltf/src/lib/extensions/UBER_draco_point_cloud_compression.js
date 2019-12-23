/* TODO: Not yet implemented
import {UBER_POINT_CLOUD_EXTENSION} from './gltf-constants';

// eslint-disable-next-line max-len
function addCompressedPointCloud(attributes, options) {
  if (!options.DracoWriter || !options.DracoLoader) {
    throw new Error('DracoWriter/DracoLoader not available');
  }

  attributes.mode = 0;
  const compressedData = options.DracoWriter.encodeSync(attributes, {draco: {pointcloud: true}});

  const bufferViewIndex = this.addBufferView(compressedData);

  const glTFMesh = {
    primitives: [
      {
        attributes: {}, // This will be populated after decompression
        mode: 0, // GL.POINTS
        extensions: {
          [UBER_POINT_CLOUD_EXTENSION]: {
            bufferView: bufferViewIndex
          }
        }
      }
    ]
  };

  this.registerRequiredExtension(UBER_POINT_CLOUD_EXTENSION);

  this.json.meshes = this.json.meshes || [];
  this.json.meshes.push(glTFMesh);
  return this.json.meshes.length - 1;
}


    this._removeExtension(UBER_POINT_CLOUD_EXTENSION);


  // Unpacks one mesh primitive and removes the extension from the primitive
  _decompressUberDracoPrimitive(primitive, options) {
    const compressedMesh = primitive.extensions && primitive.extensions[UBER_POINT_CLOUD_EXTENSION];
    if (!compressedMesh) {
      return;
    }

    if (primitive.mode !== 0) {
      throw new Error(UBER_POINT_CLOUD_EXTENSION);
    }

    // Extension will be processed, delete it
    delete primitive.extensions[UBER_POINT_CLOUD_EXTENSION];

    const buffer = this._getBufferViewArray(compressedMesh.bufferView);
    const decodedData = options.DracoLoader.parseSync(buffer);
    primitive.attributes = decodedData.attributes;
  }

*/
