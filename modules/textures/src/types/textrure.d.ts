
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
