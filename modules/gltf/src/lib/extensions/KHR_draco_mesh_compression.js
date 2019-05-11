/* eslint-disable camelcase */
import GLTFScenegraph from '../gltf-scenegraph';
import {KHR_DRACO_MESH_COMPRESSION} from '../gltf-constants';
import {getGLTFAccessors, getGLTFAccessor} from '../gltf-utils/gltf-attribute-utils';

export default class KHR_draco_mesh_compression {
  static get name() {
    return KHR_DRACO_MESH_COMPRESSION;
  }

  static decode(gltfData, options) {
    const gltfScenegraph = new GLTFScenegraph(gltfData);

    for (const mesh of gltfScenegraph.json.meshes || []) {
      // eslint-disable-next-line camelcase
      KHR_draco_mesh_compression.decompressMesh(mesh, options);
    }

    // We have now decompressed all primitives, we can remove the top-level extensions
    gltfScenegraph.removeExtension(KHR_DRACO_MESH_COMPRESSION);
  }

  static encode(gltfData, options) {
    const gltfScenegraph = new GLTFScenegraph(gltfData);

    for (const mesh of gltfScenegraph.json.meshes || []) {
      // eslint-disable-next-line camelcase
      KHR_draco_mesh_compression.compressMesh(mesh, options);
      // NOTE: We only add if something was actually compressed
      gltfScenegraph.addRequiredExtension(KHR_DRACO_MESH_COMPRESSION);
    }
  }

  // eslint-disable-next-line max-len
  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
  // Only TRIANGLES: 0x0004 and TRIANGLE_STRIP: 0x0005 are supported
  static compressMesh(attributes, indices, mode = 4, options = {}) {
    if (!options.DracoWriter || !options.DracoLoader) {
      throw new Error('DracoWriter/DracoLoader not available');
    }

    const compressedData = options.DracoWriter.encodeSync({attributes});

    // Draco compression may change the order and number of vertices in a mesh.
    // To satisfy the requirement that accessors properties be correct for both
    // compressed and uncompressed data, generators should create uncompressed
    // attributes and indices using data that has been decompressed from the Draco buffer,
    // rather than the original source data.
    const decodedData = options.DracoLoader.parseSync({attributes});
    const fauxAccessors = options._addFauxAttributes(decodedData.attributes);

    const bufferViewIndex = options.addBufferView(compressedData);

    const glTFMesh = {
      primitives: [
        {
          attributes: fauxAccessors, // TODO - verify with spec
          mode, // GL.POINTS
          extensions: {
            [KHR_DRACO_MESH_COMPRESSION]: {
              bufferView: bufferViewIndex,
              attributes: fauxAccessors // TODO - verify with spec
            }
          }
        }
      ]
    };

    return glTFMesh;
  }

  static decompressMesh(mesh, options = {}) {
    // We have a "soft dependency" on Draco to avoid bundling it when not needed
    // DracoEncoder needs to be imported and supplied by app
    // Decompress all the primitives in a mesh
    for (const primitive of mesh.primitives) {
      KHR_draco_mesh_compression._decompressMeshPrimitive(primitive, options);
      if (!primitive.attributes || Object.keys(primitive.attributes).length === 0) {
        throw new Error('Empty glTF primitive: decompression failure?');
      }
    }
  }

  // Unpacks one mesh primitive and removes the extension from the primitive
  // TODO - Implement fallback behavior per KHR_DRACO_MESH_COMPRESSION spec
  // TODO - Decompression could be threaded: Use DracoWorkerLoader?
  //
  // eslint-disable-next-line max-len
  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
  static _decompressMeshPrimitive(primitive, options) {
    const compressedPrimitive =
      primitive.extensions && primitive.extensions[KHR_DRACO_MESH_COMPRESSION];
    if (!compressedPrimitive) {
      return;
    }

    if (!options.DracoLoader || !options.decompress) {
      return;
    }

    // Extension will be processed, delete it
    delete primitive.extensions[KHR_DRACO_MESH_COMPRESSION];

    const buffer = this._getBufferViewArray(compressedPrimitive.bufferView);
    const decodedData = options.DracoLoader.parseSync(buffer);
    primitive.attributes = getGLTFAccessors(decodedData.attributes);
    if (decodedData.indices) {
      primitive.indices = getGLTFAccessor(decodedData.indices);
    }
  }
}
