/**
 * These represent the main compressed texture formats
 * Each format typically has a number of more specific subformats
 */
export type GPUTextureFormat =
  | 'dxt'
  | 'dxt-srgb'
  | 'etc1'
  | 'etc2'
  | 'pvrtc'
  | 'atc'
  | 'astc'
  | 'rgtc';

export interface TextureLevel {
  compressed: boolean;
  format: number;
  data: Uint8Array;
  witdh: number;
  height: number;
  levelSize?: number;
}

export interface CompressedTextureExtractOptions {
  mipMapLevels: number;
  width: number;
  height: number;
  sizeFunction: Function;
  internalFormat: number;
}
