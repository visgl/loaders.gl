// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const GL_TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
export const GL_TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
export const GL_TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
export const GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
export const GL_TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
export const GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851a;

export type ImageTextureCubeFace = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

export type ImageTextureCubeDirectionAlias = 'right' | 'left' | 'top' | 'bottom' | 'front' | 'back';

export const IMAGE_TEXTURE_CUBE_FACES = [
  {
    face: GL_TEXTURE_CUBE_MAP_POSITIVE_X,
    name: '+X',
    direction: 'right',
    axis: 'x',
    sign: 'positive'
  },
  {
    face: GL_TEXTURE_CUBE_MAP_NEGATIVE_X,
    name: '-X',
    direction: 'left',
    axis: 'x',
    sign: 'negative'
  },
  {face: GL_TEXTURE_CUBE_MAP_POSITIVE_Y, name: '+Y', direction: 'top', axis: 'y', sign: 'positive'},
  {
    face: GL_TEXTURE_CUBE_MAP_NEGATIVE_Y,
    name: '-Y',
    direction: 'bottom',
    axis: 'y',
    sign: 'negative'
  },
  {
    face: GL_TEXTURE_CUBE_MAP_POSITIVE_Z,
    name: '+Z',
    direction: 'front',
    axis: 'z',
    sign: 'positive'
  },
  {face: GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, name: '-Z', direction: 'back', axis: 'z', sign: 'negative'}
] as const;

export type ImageCubeTexture = Record<number, any>;
