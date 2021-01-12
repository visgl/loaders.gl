import React, {PureComponent} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {BasisLoader, CompressedTextureLoader} from '@loaders.gl/textures';
import {ImageLoader} from '@loaders.gl/images';
import {load, registerLoaders, selectLoader} from '@loaders.gl/core';
import {Texture2D} from '@luma.gl/core';
import {
  COMPRESSED_RGB_S3TC_DXT1_EXT,
  COMPRESSED_RGBA_S3TC_DXT1_EXT,
  COMPRESSED_RGBA_S3TC_DXT3_EXT,
  COMPRESSED_RGBA_S3TC_DXT5_EXT,
  COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
  COMPRESSED_RGBA_PVRTC_2BPPV1_IMG,
  COMPRESSED_RGB_ATC_WEBGL,
  COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
  COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL,
  COMPRESSED_RGB_ETC1_WEBGL
} from '../constants';

const TextureButton = styled.button`
  height: 256px;
  width: 256px;
  border: 1px solid black;
  margin: 1em;
  position: relative;
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

registerLoaders([BasisLoader, CompressedTextureLoader, ImageLoader]);

const propTypes = {
  canvas: PropTypes.object,
  image: PropTypes.object,
  gl: PropTypes.object,
  loadOptions: PropTypes.object,
  program: PropTypes.object
};

const defaultProps = {
  canvas: null,
  image: null,
  gl: null,
  loadOptions: null,
  program: null
};

export default class CompressedTexture extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      supportedFormats: this.getSupportedFormats(props.gl),
      // Temporary decision to disable worker untill texture module will be published to npm
      loadOptions: {basis: {}, worker: false},
      textureError: null
    };

    this.getTextureDataUrl = this.getTextureDataUrl.bind(this);
    this.renderImageTexture = this.renderImageTexture.bind(this);
    this.renderCompressedTexture = this.renderCompressedTexture.bind(this);
    this.setupBasisLoadOptionsIfNeeded = this.setupBasisLoadOptionsIfNeeded.bind(this);
  }

  async componentDidMount() {
    this.setupBasisLoadOptionsIfNeeded();

    const dataUrl = await this.getTextureDataUrl();
    this.setState({dataUrl});
  }

  getSupportedFormats() {
    const {gl} = this.props;
    return {
      DXT: Boolean(gl.getExtension('WEBGL_compressed_texture_s3tc')),
      PVRTC: Boolean(gl.getExtension('WEBGL_compressed_texture_pvrtc')),
      ATC: Boolean(gl.getExtension('WEBGL_compressed_texture_atc')),
      ETC1: Boolean(gl.getExtension('WEBGL_compressed_texture_etc1'))
    };
  }

  setupBasisLoadOptionsIfNeeded() {
    if (this.state.supportedFormats.DTX) {
      const loadOptions = {
        ...this.state.loadOptions,
        basis: {
          format: {
            alpha: 'BC3',
            noAlpha: 'BC1'
          }
        }
      };
      this.setState({loadOptions});
    }
  }

  async getTextureDataUrl() {
    const {loadOptions} = this.state;
    const {canvas, gl, program, image} = this.props;
    const {src} = image;

    try {
      const loader = await selectLoader(src, [CompressedTextureLoader, BasisLoader, ImageLoader]);
      const result = loader && (await load(src, loader, loadOptions));

      switch (loader && loader.name) {
        case 'CompressedTexture': {
          this.renderEmptyTexture(gl, program);
          this.renderCompressedTexture(gl, program, result, loader.name, src);
          break;
        }
        case 'Images': {
          this.renderEmptyTexture(gl, program);
          this.renderImageTexture(gl, program, result);
          break;
        }
        case 'Basis': {
          const basisTextures = result[0];
          this.renderEmptyTexture(gl, program);
          this.renderCompressedTexture(gl, program, basisTextures, loader.name, src);
          break;
        }
        default: {
          throw new Error('Unknown texture loader');
        }
      }
    } catch (error) {
      console.error(error); // eslint-disable-line
      this.renderEmptyTexture(gl, program);
      this.setState({textureError: error.message});
    }

    return canvas.toDataURL();
  }

  createCompressedTexture2D(gl, images) {
    const texture = new Texture2D(gl, {
      data: images,
      compressed: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: images.length > 1 ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      }
    });

    return texture.handle;
  }

  createCompressedTexture(gl, images) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    for (let index = 0; index < images.length; ++index) {
      const image = images[index];
      const {width, height, format, data} = image;

      gl.compressedTexImage2D(gl.TEXTURE_2D, index, format, width, height, 0, data);
    }

    if (images.length > 1) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    return texture;
  }

  renderEmptyTexture(gl, program) {
    const brownColor = new Uint8Array([68, 0, 0, 255]);
    const lumaTexture = new Texture2D(gl, {
      width: 1,
      height: 1,
      data: brownColor,
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      }
    });

    const texture = lumaTexture.handle;

    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Looks like formats can still be rendered, but presumably as converted textures...
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  renderImageTexture(gl, program, image) {
    gl.useProgram(program);
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 8);
  }

  renderCompressedTexture(gl, program, images, loaderName, texturePath) {
    if (!images || !images.length) {
      throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
    }

    if (!this.isFormatSupported(images[0].format)) {
      throw new Error(`Texture format ${images[0].format} not supported by this GPU`);
    }

    const texture = this.createCompressedTexture2D(gl, images);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.useProgram(program);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // eslint-disable-next-line complexity
  isFormatSupported(format) {
    if (typeof format !== 'number') {
      throw new Error('Invalid internal format of compressed texture');
    }
    const {DXT, PVRTC, ATC, ETC1} = this.state.supportedFormats;

    switch (format) {
      case COMPRESSED_RGB_S3TC_DXT1_EXT:
      case COMPRESSED_RGBA_S3TC_DXT3_EXT:
      case COMPRESSED_RGBA_S3TC_DXT5_EXT:
      case COMPRESSED_RGBA_S3TC_DXT1_EXT:
        return DXT;

      case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
        return PVRTC;

      case COMPRESSED_RGB_ATC_WEBGL:
      case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
      case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
        return ATC;

      case COMPRESSED_RGB_ETC1_WEBGL:
        return ETC1;

      default:
        return false;
    }
  }

  render() {
    const {dataUrl, textureError} = this.state;
    const {format} = this.props.image;

    return dataUrl ? (
      <TextureButton style={{backgroundImage: `url(${dataUrl})`}}>
        {!textureError ? (
          <ImageFormatHeader>{format}</ImageFormatHeader>
        ) : (
          <ErrorFormatHeader style={{color: 'red'}}>{textureError}</ErrorFormatHeader>
        )}
      </TextureButton>
    ) : null;
  }
}

CompressedTexture.propTypes = propTypes;
CompressedTexture.defaultProps = defaultProps;
