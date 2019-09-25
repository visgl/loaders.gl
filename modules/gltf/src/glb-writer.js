import encodeGLBSync from './lib/encode-glb';

export default {
  name: 'GLB',
  extensions: ['glb'],
  mimeType: 'model/gltf-binary',
  encodeSync,
  binary: true,
  options: {
    glb: {}
  }
};

function encodeSync(glb, options) {
  const {byteOffset = 0} = options;

  // Calculate length and allocate buffer
  const byteLength = encodeGLBSync(glb, null, byteOffset, options);
  const arrayBuffer = new ArrayBuffer(byteLength);

  // Encode into buffer
  const dataView = new DataView(arrayBuffer);
  encodeGLBSync(glb, dataView, byteOffset, options);

  return arrayBuffer;
}
