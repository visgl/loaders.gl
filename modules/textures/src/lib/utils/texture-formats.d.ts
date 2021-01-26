/**
 * These represent the main compressed texture formats
 * Each format typically has a number of more specific subformats
 */
export type GPUTextureFormat = 
  'dxt' |
  'dxt-srgb' |
  'etc1' |
  'etc2' |
  'pvrtc' |
  'atc' |
  'astc' |
  'rgtc'
  ;

/**
 * Returns a list of formats.
 * Creates a temporary WebGLRenderingContext if none is provided.
 * 
 * @param gl - Optional context. 
 */
export function getSupportedGPUTextureFormats(gl?: WebGL2RenderingContext): Set<String>;
