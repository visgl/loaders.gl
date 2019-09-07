// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
// Only TRIANGLES: 0x0004 and TRIANGLE_STRIP: 0x0005 are supported

/* eslint-disable camelcase */
import GLTFScenegraph from '../gltf-scenegraph';
import {KHR_DRACO_MESH_COMPRESSION} from '../gltf-constants';
import {getGLTFAccessors, getGLTFAccessor} from '../gltf-utils/gltf-attribute-utils';
import {parse} from '@loaders.gl/core';

export default class KHR_draco_mesh_compression {
  static get name() {
    return KHR_DRACO_MESH_COMPRESSION;
  }

  // Note: We have a "soft dependency" on Draco to avoid bundling it when not needed
  static async decode(gltfData, options = {}) {
    if (!options.decompress) {
      return;
    }

    const scenegraph = new GLTFScenegraph(gltfData);
    const promises = [];
    for (const primitive of meshPrimitiveIterator(scenegraph)) {
      if (scenegraph.getObjectExtension(primitive, KHR_DRACO_MESH_COMPRESSION)) {
        promises.push(decompressPrimitive(primitive, scenegraph, options));
      }
    }

    // Decompress meshes in parallel
    await Promise.all(promises);

    // We have now decompressed all primitives, so remove the top-level extensions
    scenegraph.removeExtension(KHR_DRACO_MESH_COMPRESSION);
  }

  static decodeSync(gltfData, options) {
    if (!options.decompress) {
      return;
    }
    const scenegraph = new GLTFScenegraph(gltfData);
    if (scenegraph.getRequiredExtension(KHR_DRACO_MESH_COMPRESSION)) {
      throw new Error('Cannot synchronously decode Draco');
    }
    // TODO - we can support sync decoding, let's just keep code/bundle size in check...
  }

  static encode(gltfData, options = {}) {
    const scenegraph = new GLTFScenegraph(gltfData);

    for (const mesh of scenegraph.json.meshes || []) {
      // eslint-disable-next-line camelcase
      compressMesh(mesh, options);
      // NOTE: Only add the extension if something was actually compressed
      scenegraph.addRequiredExtension(KHR_DRACO_MESH_COMPRESSION);
    }
  }
}

// PRIVATE

// Unpacks one mesh primitive and removes the extension from the primitive
// DracoDecoder needs to be imported and registered by app
// Returns: Promise that resolves when all pending draco decoder jobs for this mesh complete

// TODO - Implement fallback behavior per KHR_DRACO_MESH_COMPRESSION spec

async function decompressPrimitive(primitive, scenegraph, options) {
  const compressedPrimitive = scenegraph.getObjectExtension(primitive, KHR_DRACO_MESH_COMPRESSION);

  // eslint-disable-next-line
  const buffer = scenegraph.getTypedArrayForBufferView(compressedPrimitive.bufferView);

  // TODO - parse does not yet deal well with byte offsets embedded in typed arrays. Copy buffer
  const subArray = new Uint8Array(buffer.buffer).subarray(buffer.byteOffset); // , buffer.byteLength);
  const bufferCopy = new Uint8Array(subArray);

  const decodedData = await parse(bufferCopy);

  primitive.attributes = getGLTFAccessors(decodedData.attributes);
  if (decodedData.indices) {
    primitive.indices = getGLTFAccessor(decodedData.indices);
  }

  // Extension has been processed, delete it
  // delete primitive.extensions[KHR_DRACO_MESH_COMPRESSION];

  checkPrimitive(primitive);
}

// eslint-disable-next-line max-len
// Only TRIANGLES: 0x0004 and TRIANGLE_STRIP: 0x0005 are supported
function compressMesh(attributes, indices, mode = 4, options = {}) {
  if (!options.DracoWriter || !options.DracoLoader) {
    throw new Error('DracoWriter/DracoLoader not available');
  }

  // TODO - use registered DracoWriter...
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

function checkPrimitive(primitive) {
  if (!primitive.attributes && Object.keys(primitive.attributes).length > 0) {
    throw new Error('Empty glTF primitive detected: Draco decompression failure?');
  }
}

function* meshPrimitiveIterator(scenegraph) {
  for (const mesh of scenegraph.json.meshes || []) {
    for (const primitive of mesh.primitives) {
      yield primitive;
    }
  }
}
