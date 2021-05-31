/** @typedef {import('./texture-formats').GPUTextureFormat} GPUTextureFormat */

const BROWSER_PREFIXES = ['', 'WEBKIT_', 'MOZ_'];

/** @type {{[key: string]: GPUTextureFormat}} */
const WEBGL_EXTENSIONS = {
  /* eslint-disable camelcase */
  WEBGL_compressed_texture_s3tc: 'dxt',
  WEBGL_compressed_texture_s3tc_srgb: 'dxt-srgb',
  WEBGL_compressed_texture_etc1: 'etc1',
  WEBGL_compressed_texture_etc: 'etc2',
  WEBGL_compressed_texture_pvrtc: 'pvrtc',
  WEBGL_compressed_texture_atc: 'atc',
  WEBGL_compressed_texture_astc: 'astc',
  EXT_texture_compression_rgtc: 'rgtc'
  /* eslint-enable camelcase */
};

/** @type {Set<GPUTextureFormat>?} */
let formats = null;

export function getSupportedGPUTextureFormats(gl) {
  if (!formats) {
    gl = gl || getWebGLContext();

    formats = new Set();

    for (const prefix of BROWSER_PREFIXES) {
      for (const extension in WEBGL_EXTENSIONS) {
        // eslint-disable-next-line max-depth
        if (gl && gl.getExtension(`${prefix}${extension}`)) {
          const gpuTextureFormat = WEBGL_EXTENSIONS[extension];
          formats.add(gpuTextureFormat);
        }
      }
    }
  }

  return formats;
}

/**
 * @returns {WebGLRenderingContext?}
 */
function getWebGLContext() {
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl');
  } catch (error) {
    return null;
  }
}
