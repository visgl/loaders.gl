// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as React from 'react';
// @ts-ignore Missing local type package in this standalone example.
import styled from 'styled-components';

import {load, registerLoaders, selectLoader, fetchFile} from '@loaders.gl/core';
import {BasisLoader, CompressedTextureLoader, CrunchWorkerLoader} from '@loaders.gl/textures';
import type {LoaderOptions} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import type {ImageType} from '@loaders.gl/images';

import {Device, Texture} from '@luma.gl/core';
import type {TextureFormat} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

type TextureInfo = {
  format?: string;
  name?: string;
  src: string;
  useBasis?: boolean;
};

type TextureLevelData = {
  data: Uint8Array;
  width: number;
  height: number;
  levelSize?: number;
  textureFormat?: TextureFormat;
};

type TextureStat = {
  name: string;
  value: number | string;
  units: string;
};

const BROWSER_TEXTURE_FORMATS: Record<string, TextureFormat[]> = {
  dxt: ['bc1-rgb-unorm-webgl', 'bc1-rgba-unorm', 'bc2-rgba-unorm', 'bc3-rgba-unorm'],
  'dxt-srgb': [
    'bc1-rgb-unorm-srgb-webgl',
    'bc1-rgba-unorm-srgb',
    'bc2-rgba-unorm-srgb',
    'bc3-rgba-unorm-srgb'
  ],
  etc1: ['etc1-rbg-unorm-webgl'],
  etc2: [
    'etc2-rgb8unorm',
    'etc2-rgb8unorm-srgb',
    'etc2-rgb8a1unorm',
    'etc2-rgb8a1unorm-srgb',
    'etc2-rgba8unorm',
    'etc2-rgba8unorm-srgb',
    'eac-r11unorm',
    'eac-r11snorm',
    'eac-rg11unorm',
    'eac-rg11snorm'
  ],
  pvrtc: [
    'pvrtc-rgb4unorm-webgl',
    'pvrtc-rgba4unorm-webgl',
    'pvrtc-rbg2unorm-webgl',
    'pvrtc-rgba2unorm-webgl'
  ],
  atc: ['atc-rgb-unorm-webgl', 'atc-rgba-unorm-webgl', 'atc-rgbai-unorm-webgl'],
  bc6h: ['bc6h-rgb-ufloat', 'bc6h-rgb-float'],
  bc7: ['bc7-rgba-unorm', 'bc7-rgba-unorm-srgb'],
  astc: [
    'astc-4x4-unorm',
    'astc-4x4-unorm-srgb',
    'astc-5x4-unorm',
    'astc-5x4-unorm-srgb',
    'astc-5x5-unorm',
    'astc-5x5-unorm-srgb',
    'astc-6x5-unorm',
    'astc-6x5-unorm-srgb',
    'astc-6x6-unorm',
    'astc-6x6-unorm-srgb',
    'astc-8x5-unorm',
    'astc-8x5-unorm-srgb',
    'astc-8x6-unorm',
    'astc-8x6-unorm-srgb',
    'astc-8x8-unorm',
    'astc-8x8-unorm-srgb',
    'astc-10x5-unorm',
    'astc-10x5-unorm-srgb',
    'astc-10x6-unorm',
    'astc-10x6-unorm-srgb',
    'astc-10x8-unorm',
    'astc-10x8-unorm-srgb',
    'astc-10x10-unorm',
    'astc-10x10-unorm-srgb',
    'astc-12x10-unorm',
    'astc-12x10-unorm-srgb',
    'astc-12x12-unorm',
    'astc-12x12-unorm-srgb'
  ],
  rgtc: ['bc4-r-unorm', 'bc4-r-snorm', 'bc5-rg-unorm', 'bc5-rg-snorm']
};

const TEXTURES_BASE_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/textures/test/data/';

const TEXTURE_SAMPLER = {
  addressModeU: 'clamp-to-edge' as const,
  addressModeV: 'clamp-to-edge' as const,
  magFilter: 'linear' as const,
  minFilter: 'linear' as const,
  mipmapFilter: 'none' as const
};

const TextureButton = styled.button`
  height: 256px;
  width: 256px;
  border: 1px solid black;
  margin: 1em;
  position: relative;
  margin-left: 0;
`;

const ImageFormatHeader = styled.h1`
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  color: white;
  font-size: 16px;
`;
const ErrorFormatHeader = styled.h1`
  color: red;
  font-size: 16px;
`;

const TextureInfoList = styled.ul`
  position: absolute;
  transition: opacity 0.2s;
  top: 20px;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  padding: 10px;
  opacity: 0.8;
  background-color: black;
  color: white;
  border-radius: 5px;
  min-width: 200px;
  list-style: none;
  font-size: 14px;
`;

registerLoaders([BasisLoader, CompressedTextureLoader, ImageLoader]);

function getSupportedTextureFormats(device: Device): Set<TextureFormat> {
  const textureFormats = new Set<TextureFormat>();

  for (const textureFormatsForGroup of Object.values(BROWSER_TEXTURE_FORMATS)) {
    for (const textureFormat of textureFormatsForGroup) {
      if (device.isTextureFormatSupported(textureFormat)) {
        textureFormats.add(textureFormat);
      }
    }
  }

  return textureFormats;
}

function selectSupportedBasisFormat(
  device: Device,
  supportedTextureFormats: Iterable<TextureFormat> = getSupportedTextureFormats(device)
): string | {alpha: string; noAlpha: string} {
  const textureFormatSet = new Set(supportedTextureFormats);
  if (hasSupportedTextureFormat(textureFormatSet, ['astc-4x4-unorm', 'astc-4x4-unorm-srgb'])) {
    return 'astc-4x4';
  }
  if (
    hasSupportedTextureFormat(textureFormatSet, [
      'bc1-rgb-unorm-webgl',
      'bc1-rgb-unorm-srgb-webgl',
      'bc1-rgba-unorm',
      'bc1-rgba-unorm-srgb',
      'bc2-rgba-unorm',
      'bc2-rgba-unorm-srgb',
      'bc3-rgba-unorm',
      'bc3-rgba-unorm-srgb',
      'bc4-r-unorm',
      'bc4-r-snorm',
      'bc5-rg-unorm',
      'bc5-rg-snorm',
      'bc6h-rgb-ufloat',
      'bc6h-rgb-float',
      'bc7-rgba-unorm',
      'bc7-rgba-unorm-srgb'
    ])
  ) {
    return {
      alpha: 'bc3',
      noAlpha: 'bc1'
    };
  }
  if (
    hasSupportedTextureFormat(textureFormatSet, [
      'pvrtc-rgb4unorm-webgl',
      'pvrtc-rgba4unorm-webgl',
      'pvrtc-rbg2unorm-webgl',
      'pvrtc-rgba2unorm-webgl'
    ])
  ) {
    return {
      alpha: 'pvrtc1-4-rgba',
      noAlpha: 'pvrtc1-4-rgb'
    };
  }
  if (
    hasSupportedTextureFormat(textureFormatSet, [
      'etc2-rgb8unorm',
      'etc2-rgb8unorm-srgb',
      'etc2-rgb8a1unorm',
      'etc2-rgb8a1unorm-srgb',
      'etc2-rgba8unorm',
      'etc2-rgba8unorm-srgb',
      'eac-r11unorm',
      'eac-r11snorm',
      'eac-rg11unorm',
      'eac-rg11snorm'
    ])
  ) {
    return 'etc2';
  }
  if (textureFormatSet.has('etc1-rbg-unorm-webgl')) {
    return 'etc1';
  }
  if (
    hasSupportedTextureFormat(textureFormatSet, [
      'atc-rgb-unorm-webgl',
      'atc-rgba-unorm-webgl',
      'atc-rgbai-unorm-webgl'
    ])
  ) {
    return {
      alpha: 'atc-rgba-interpolated-alpha',
      noAlpha: 'atc-rgb'
    };
  }
  return 'rgb565';
}

function hasSupportedTextureFormat(
  textureFormatSet: Set<TextureFormat>,
  candidateFormats: TextureFormat[]
): boolean {
  return candidateFormats.some((textureFormat) => textureFormatSet.has(textureFormat));
}

// TEXTURE SHADERS

const vs = `\
#version 300 es
precision highp float;

in vec2 position;

out vec2 uv;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  uv = vec2(position.x * .5, -position.y * .5) + vec2(.5, .5);
}
`;

const fs = `\
#version 300 es
precision highp float;

uniform sampler2D uTexture;

in vec2 uv;

out vec4 fragColor;

void main() {
  fragColor = vec4(texture(uTexture, uv).rgb, 1.);
}
`;

/** Create a reusable model */
export function createModel(device: Device): Model {
  const data = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
  const position = device.createBuffer({data});

  return new Model(device, {
    vs,
    fs,
    topology: 'triangle-strip',
    vertexCount: 4,
    bufferLayout: [{name: 'position', format: 'float32x2'}],
    attributes: {position}
  });
}

type CompressedTextureProps = {
  device: Device;
  canvas: HTMLCanvasElement;
  image: ImageType | TextureInfo | File;
  model: Model;
};

type CompressedTextureState = {
  loadOptions: LoaderOptions;
  textureError: Error | null;
  showStats: boolean;
  stats: TextureStat[];
  dataUrl: string | null;
};

export class CompressedTexture extends React.PureComponent<
  CompressedTextureProps,
  CompressedTextureState
> {
  constructor(props: CompressedTextureProps) {
    super(props);

    const loadOptions = this.getLoadOptions(props.device);

    this.state = {
      loadOptions,
      textureError: null,
      showStats: false,
      stats: [],
      dataUrl: null
    };
  }

  async componentDidMount() {
    const dataUrl = await this.getTextureDataUrl(this.props.device);
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({dataUrl});
  }

  getLoadOptions(device: Device) {
    return {
      core: {
        worker: false,
        CDN: null
      },
      basis: {
        format: selectSupportedBasisFormat(device)
      }
    };
  }

  isExpectedTextureError(error: Error): boolean {
    return (
      error.message.includes('not supported by this GPU') ||
      error.message.includes('no parser found and worker is disabled') ||
      error.message.includes('Crunch textures require worker decoding')
    );
  }

  // eslint-disable-next-line max-statements
  async getTextureDataUrl(device: Device) {
    const {loadOptions} = this.state;
    const {canvas, model, image} = this.props;

    try {
      const {arrayBuffer, length, src, useBasis} = await this.getLoadedData(image);

      const options = {...loadOptions};
      if (useBasis) {
        options['compressed-texture'] = {useBasis: true};
      }

      const loader = await selectLoader(src, [
        CompressedTextureLoader,
        CrunchWorkerLoader,
        BasisLoader,
        ImageLoader
      ]);
      if (!loader) {
        throw new Error(`Could not select a loader for ${src}`);
      }
      if (loader.id === 'crunch') {
        throw new Error('Crunch textures require worker decoding, which is disabled in this example');
      }

      const result = await load(arrayBuffer, loader, options);

      this.addStat('File Size', Math.floor(length / 1024), 'Kb');

      switch (loader.id) {
        case 'crunch':
        case 'compressed-texture':
          this.renderEmptyTexture(device, model);
          this.renderCompressedTexture(
            device,
            model,
            result as TextureLevelData[],
            loader.name,
            src
          );
          break;
        case 'image':
          this.renderEmptyTexture(device, model);
          this.renderImageTexture(device, model, result as ImageType);
          break;
        case 'basis':
          this.renderEmptyTexture(device, model);
          this.renderCompressedTexture(
            device,
            model,
            (result as TextureLevelData[][])[0],
            loader.name,
            src
          );
          break;
        default:
          throw new Error('Unknown texture loader');
      }
    } catch (error) {
      if (error instanceof Error && !this.isExpectedTextureError(error)) {
        console.error(error); // eslint-disable-line
      }
      this.renderEmptyTexture(device, model);
      this.setState({
        textureError: error instanceof Error ? error : new Error(String(error))
      });
    }

    return canvas.toDataURL();
  }

  async getLoadedData(image: ImageType | TextureInfo | File) {
    let length = 0;
    let src = '';
    let useBasis = false;
    let arrayBuffer: ArrayBuffer;

    // eslint-disable-next-line no-undef
    if (image instanceof File) {
      arrayBuffer = await image.arrayBuffer();
      length = image.size;
      src = image.name;
    } else {
      const texture = image as TextureInfo;
      src = `${TEXTURES_BASE_URL}${texture.src}`;
      const response = await fetchFile(src);
      arrayBuffer = await response.arrayBuffer();
      length = arrayBuffer.byteLength;
      useBasis = texture.useBasis || false;
    }

    return {arrayBuffer, length, src, useBasis};
  }

  createCompressedTexture(device: Device, image: TextureLevelData): Texture {
    if (!image.textureFormat) {
      throw new Error('Compressed texture is missing a textureFormat value');
    }

    const texture = device.createTexture({
      format: image.textureFormat,
      width: image.width,
      height: image.height,
      sampler: TEXTURE_SAMPLER
    });
    texture.copyImageData({data: image.data});

    return texture;
  }

  renderEmptyTexture(device: Device, model: Model): Texture {
    const brownColor = new Uint8Array([68, 0, 0, 255]);
    const emptyTexture = device.createTexture({
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      sampler: TEXTURE_SAMPLER
    });
    emptyTexture.copyImageData({data: brownColor});

    const renderPass = device.beginRenderPass();
    model.setBindings({uTexture: emptyTexture});
    model.draw(renderPass);
    renderPass.end();

    return emptyTexture;
  }

  renderImageTexture(device: Device, model: Model, image: ImageType) {
    const startTime = performance.now();
    const texture = device.createTexture({
      format: 'rgba8unorm',
      width: image.width,
      height: image.height,
      sampler: TEXTURE_SAMPLER
    });
    if (device.isExternalImage(image)) {
      texture.copyExternalImage({image});
    } else {
      texture.copyImageData({data: image.data});
    }

    const renderPass = device.beginRenderPass();
    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();

    const uploadTime = performance.now() - startTime;

    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${image.width} x ${image.height}`);
    this.addStat(
      'Size in memory (Lvl 0)',
      Math.floor((image.width * image.height * 4) / 1024),
      'Kb'
    );
  }

  renderCompressedTexture(
    device: Device,
    model: Model,
    images: TextureLevelData[],
    loaderName: string,
    texturePath: string
  ) {
    if (!images || !images.length) {
      throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
    }

    const [image] = images;
    const {textureFormat, width, height, levelSize} = image;

    if (!textureFormat || !device.isTextureFormatSupported(textureFormat)) {
      throw new Error(`Texture format ${textureFormat || 'unknown'} not supported by this GPU`);
    }

    const startTime = performance.now();
    const texture = this.createCompressedTexture(device, image);

    const renderPass = device.beginRenderPass();
    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();

    const uploadTime = performance.now() - startTime;

    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${width} x ${height}`);
    this.addStat('GPU Format', textureFormat);
    if (levelSize) {
      this.addStat('Size in memory (Lvl 0)', Math.floor(levelSize / 1024), 'Kb');
    }
  }

  addStat(name: string, value: number | string, units = '') {
    this.setState((state) => ({
      stats: [...state.stats, {name, value, units}]
    }));
  }

  renderStats() {
    const {stats, showStats} = this.state;

    if (!stats.length) {
      return null;
    }

    return (
      <TextureInfoList style={{opacity: showStats ? 0.8 : 0}}>
        {stats.map((stat, index) => (
          <li key={index}>{`${stat.name}: ${stat.value}${stat.units}`}</li>
        ))}
      </TextureInfoList>
    );
  }

  render() {
    const {dataUrl, textureError} = this.state;
    const {format, name} = this.props.image as TextureInfo;

    return dataUrl ? (
      <TextureButton
        style={{backgroundImage: `url(${dataUrl})`}}
        onMouseEnter={() => this.setState({showStats: true})}
        onMouseLeave={() => this.setState({showStats: false})}
      >
        {!textureError ? (
          <ImageFormatHeader>{format || name}</ImageFormatHeader>
        ) : (
          <ErrorFormatHeader style={{color: 'red'}}>{textureError.message}</ErrorFormatHeader>
        )}
        {this.renderStats()}
      </TextureButton>
    ) : null;
  }
}
