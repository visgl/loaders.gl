import {encodeGLTFSync} from './lib/encode-gltf';

export default {
  name: 'glTF',
  extensions: ['glb'], // We only support encoding to binary GLB, not to JSON GLTF
  // mimeType: 'model/gltf-binary',
  mimeType: 'model/gltf+json',
  encodeSync,
  binary: true,
  defaultOptions: {
    useGLTFBuilder: true // Note: GLTFBuilder will be removed in v2
  }
};

function encodeSync(gltf, options = {}) {
  const {byteOffset = 0} = options;

  // Calculate length, then create arraybuffer and encode
  const byteLength = encodeGLTFSync(gltf, null, byteOffset, options);
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  encodeGLTFSync(gltf, dataView, byteOffset, options);

  return arrayBuffer;
}
