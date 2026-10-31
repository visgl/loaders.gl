// SPDX-License-Identifier: MIT

const DRACO_VERSION = '1.5.7';
const DRACO_RELEASE_COMMIT = '8786740086a9f4d83f44aa83badfbea4dce7a1b5';
const STATIC_DECODER_URL = `https://www.gstatic.com/draco/versioned/decoders/${DRACO_VERSION}`;
const STATIC_ENCODER_URL = `https://cdn.jsdelivr.net/gh/google/draco@${DRACO_RELEASE_COMMIT}/javascript`;

/** External Draco runtime assets understood by `loadLibrary`. */
export const DRACO_EXTERNAL_LIBRARIES = {
  /** WebAssembly decoder JavaScript wrapper. */
  DECODER: 'draco_wasm_wrapper.js',
  /** WebAssembly decoder binary. */
  DECODER_WASM: 'draco_decoder.wasm',
  /** glTF-profile WebAssembly decoder JavaScript wrapper. */
  GLTF_DECODER: 'draco_wasm_wrapper_gltf.js',
  /** glTF-profile WebAssembly decoder binary. */
  GLTF_DECODER_WASM: 'draco_decoder_gltf.wasm',
  /** JavaScript decoder fallback. */
  FALLBACK_DECODER: 'draco_decoder.js',
  /** WebAssembly encoder JavaScript wrapper. */
  ENCODER: 'draco_encoder.js',
  /** WebAssembly encoder binary. */
  ENCODER_WASM: 'draco_encoder.wasm'
} as const;

/** Default versioned URLs for external Draco runtime assets. */
export const DRACO_EXTERNAL_LIBRARY_URLS = {
  [DRACO_EXTERNAL_LIBRARIES.DECODER]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.DECODER}`,
  [DRACO_EXTERNAL_LIBRARIES.DECODER_WASM]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.DECODER_WASM}`,
  [DRACO_EXTERNAL_LIBRARIES.GLTF_DECODER]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.GLTF_DECODER}`,
  [DRACO_EXTERNAL_LIBRARIES.GLTF_DECODER_WASM]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.GLTF_DECODER_WASM}`,
  [DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER}`,
  [DRACO_EXTERNAL_LIBRARIES.ENCODER]: `${STATIC_ENCODER_URL}/${DRACO_EXTERNAL_LIBRARIES.ENCODER}`,
  [DRACO_EXTERNAL_LIBRARIES.ENCODER_WASM]: `${STATIC_ENCODER_URL}/${DRACO_EXTERNAL_LIBRARIES.ENCODER_WASM}`
} as const;
