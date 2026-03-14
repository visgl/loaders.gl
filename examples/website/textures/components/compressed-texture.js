import {jsx as _jsx, jsxs as _jsxs} from 'react/jsx-runtime';
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as React from 'react';
import styled from 'styled-components';
import {load, registerLoaders, selectLoader, fetchFile} from '@loaders.gl/core';
import {BasisLoader, CompressedTextureLoader, CrunchWorkerLoader} from '@loaders.gl/textures';
import {ImageLoader} from '@loaders.gl/images';
import {Model} from '@luma.gl/engine';
const TEXTURE_LIBRARY_MODULES = {
  'basis_transcoder.js': new URL(
    '../../../../modules/textures/src/libs/basis_transcoder.js',
    import.meta.url
  ).toString(),
  'basis_transcoder.wasm': new URL(
    '../../../../modules/textures/src/libs/basis_transcoder.wasm',
    import.meta.url
  ).toString(),
  'basis_encoder.js': new URL(
    '../../../../modules/textures/src/libs/basis_encoder.js',
    import.meta.url
  ).toString(),
  'basis_encoder.wasm': new URL(
    '../../../../modules/textures/src/libs/basis_encoder.wasm',
    import.meta.url
  ).toString(),
  'crunch.js': new URL(
    '../../../../modules/textures/src/libs/crunch.js',
    import.meta.url
  ).toString()
};
const BROWSER_PREFIXES = ['', 'WEBKIT_', 'MOZ_'];
const BROWSER_GPU_EXTENSIONS = {
  WEBGL_compressed_texture_s3tc: ['dxt'],
  WEBGL_compressed_texture_s3tc_srgb: ['dxt-srgb'],
  WEBGL_compressed_texture_pvrtc: ['pvrtc'],
  WEBGL_compressed_texture_atc: ['atc'],
  WEBGL_compressed_texture_astc: ['astc'],
  EXT_texture_compression_rgtc: ['rgtc'],
  EXT_texture_compression_bptc: ['bc6h', 'bc7'],
  WEBGL_compressed_texture_etc1: ['etc1'],
  WEBGL_compressed_texture_etc: ['etc2']
};
const BROWSER_TEXTURE_FORMATS = {
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
function detectSupportedTextureFormats(gl) {
  const textureFormats = new Set();
  try {
    const canvas = document.createElement('canvas');
    gl = gl || canvas.getContext('webgl');
  } catch (error) {
    gl = null;
  }
  if (!gl) {
    return textureFormats;
  }
  for (const prefix of BROWSER_PREFIXES) {
    for (const extensionName of Object.keys(BROWSER_GPU_EXTENSIONS)) {
      if (gl.getExtension(`${prefix}${extensionName}`)) {
        const gpuTextureFormats = BROWSER_GPU_EXTENSIONS[extensionName];
        for (const textureGroup of gpuTextureFormats) {
          const textureFormatsForGroup = BROWSER_TEXTURE_FORMATS[textureGroup];
          textureFormatsForGroup.forEach((textureFormat) => textureFormats.add(textureFormat));
        }
      }
    }
  }
  return textureFormats;
}
function selectSupportedBasisFormat(supportedTextureFormats = detectSupportedTextureFormats()) {
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
function hasSupportedTextureFormat(textureFormatSet, candidateFormats) {
  return candidateFormats.some((textureFormat) => textureFormatSet.has(textureFormat));
}
const TEXTURES_BASE_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/textures/test/data/';
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
const TextureInfo = styled.ul`
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
export function createModel(device) {
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
export class CompressedTexture extends React.PureComponent {
  static defaultProps = {
    device: null,
    canvas: null,
    image: null,
    model: null
  };
  constructor(props) {
    super(props);
    const loadOptions = this.getLoadOptions();
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
  getExtension(name) {
    const {device} = this.props;
    const vendorPrefixes = ['', 'WEBKIT_', 'MOZ_'];
    let ext = null;
    for (const index in vendorPrefixes) {
      ext = Boolean(device.getExtension(vendorPrefixes[index] + name));
      if (ext) {
        break;
      }
    }
    return ext;
  }
  getLoadOptions() {
    return {
      modules: TEXTURE_LIBRARY_MODULES,
      basis: {
        format: selectSupportedBasisFormat()
      }
    };
  }
  // eslint-disable-next-line max-statements
  async getTextureDataUrl(device) {
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
      const result = loader && (await load(arrayBuffer, loader, options));
      this.addStat('File Size', Math.floor(length / 1024), 'Kb');
      switch (loader?.id) {
        case 'crunch':
        case 'compressed-texture':
          this.renderEmptyTexture(device, model);
          this.renderCompressedTexture(device, model, result, loader.name, src);
          break;
        case 'image':
          this.renderEmptyTexture(device, model);
          this.renderImageTexture(device, model, result);
          break;
        case 'basis':
          const basisTextures = result[0];
          this.renderEmptyTexture(device, model);
          this.renderCompressedTexture(device, model, basisTextures, loader.name, src);
          break;
        default:
          throw new Error('Unknown texture loader');
      }
    } catch (error) {
      console.error(error); // eslint-disable-line
      this.renderEmptyTexture(device, model);
      this.setState({textureError: error.message});
    }
    return canvas.toDataURL();
  }
  async getLoadedData(image) {
    let length = 0;
    let src = '';
    let useBasis = false;
    let arrayBuffer;
    // eslint-disable-next-line no-undef
    if (image instanceof File) {
      arrayBuffer = await image.arrayBuffer();
      length = image.size;
      src = image.name;
    } else {
      src = `${TEXTURES_BASE_URL}${image.src}`;
      const response = await fetchFile(src);
      arrayBuffer = await response.arrayBuffer();
      length = arrayBuffer.byteLength;
      useBasis = image.useBasis || false;
    }
    return {arrayBuffer, length, src, useBasis};
  }
  createCompressedTexture(device, images) {
    const [baseLevel] = images;
    const {data, height, textureFormat, width} = baseLevel;
    if (!textureFormat) {
      throw new Error('Texture loader did not expose a textureFormat');
    }
    const texture = device.createTexture({
      data,
      format: textureFormat,
      height,
      width
      // parameters: {
      //   [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_MIN_FILTER]: images.length > 1 ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR,
      //   [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
      //   [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      // }
    });
    return texture;
  }
  renderEmptyTexture(device, model) {
    const brownColor = new Uint8Array([68, 0, 0, 255]);
    const emptyTexture = device.createTexture({
      width: 1,
      height: 1,
      data: brownColor,
      mipmaps: true
      // parameters: {
      //   [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
      //   [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      // }
    });
    const renderPass = device.beginRenderPass();
    model.setBindings({uTexture: emptyTexture});
    model.draw(renderPass);
    renderPass.end();
    // model.draw();
    return emptyTexture;
  }
  renderImageTexture(device, model, image) {
    const texture = device.createTexture({
      data: image
      // parameters: {
      //   [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
      //   [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
      //   [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      // }
    });
    const renderPass = device.beginRenderPass();
    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();
    const startTime = new Date();
    const uploadTime = Date.now() - startTime.getMilliseconds();
    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${image.width} x ${image.height}`);
    this.addStat(
      'Size in memory (Lvl 0)',
      Math.floor((image.width * image.height * 4) / 1024),
      'Kb'
    );
  }
  renderCompressedTexture(device, model, images, loaderName, texturePath) {
    if (!images || !images.length) {
      throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
    }
    // We take the first image because it has main propeties of compressed image.
    const {levelSize, textureFormat, width, height} = images[0];
    if (!this.isFormatSupported(textureFormat)) {
      throw new Error(`Texture format ${textureFormat || 'unknown'} not supported by this GPU`);
    }
    const startTime = new Date();
    const texture = this.createCompressedTexture(device, images);
    const renderPass = device.beginRenderPass();
    model.setBindings({uTexture: texture});
    model.draw(renderPass);
    renderPass.end();
    const uploadTime = Date.now() - startTime.getMilliseconds();
    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${width} x ${height}`);
    if (levelSize) {
      this.addStat('Size in memory (Lvl 0)', Math.floor(levelSize / 1024), 'Kb');
    }
  }
  isFormatSupported(textureFormat) {
    if (!textureFormat) {
      throw new Error('Texture loader did not expose a textureFormat');
    }
    return detectSupportedTextureFormats().has(textureFormat);
  }
  addStat(name, value, units = '') {
    const newStats = [...this.state.stats, {name, value, units}];
    this.setState({stats: newStats});
  }
  renderStats() {
    const {stats} = this.state;
    if (!stats.length) {
      return null;
    }
    const infoList = [];
    for (let index = 0; index < stats.length; index++) {
      infoList.push(
        _jsx(
          'li',
          {children: `${stats[index].name}: ${stats[index].value}${stats[index].units}`},
          index
        )
      );
    }
    return _jsx(TextureInfo, {
      style: {opacity: this.state.showStats ? 0.8 : 0},
      children: infoList
    });
  }
  render() {
    const {dataUrl, textureError} = this.state;
    const {format, name} = this.props.image;
    return dataUrl
      ? _jsxs(TextureButton, {
          style: {backgroundImage: `url(${dataUrl})`},
          onMouseEnter: () => this.setState({showStats: true}),
          onMouseLeave: () => this.setState({showStats: false}),
          children: [
            !textureError
              ? _jsx(ImageFormatHeader, {children: format || name})
              : _jsx(ErrorFormatHeader, {style: {color: 'red'}, children: textureError}),
            this.renderStats()
          ]
        })
      : null;
  }
}
