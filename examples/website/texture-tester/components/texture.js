import React, {PureComponent} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {BasisLoader, _CompressedTextureLoader} from '@loaders.gl/textures';
import {ImageLoader} from '@loaders.gl/images';
import {load, registerLoaders, selectLoader} from '@loaders.gl/core';
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

registerLoaders([BasisLoader, _CompressedTextureLoader, ImageLoader]);

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
      dxtSupported: false,
      pvrtcSupported: false,
      atcSupported: false,
      etc1Supported: false,
      // Temporary decision to disable worker untill texture module will be published to npm
      loadOptions: {basis: {}, image: {decode: true, type: 'image'}, worker: false},
      textureError: null
    };

    this.renderTexture = this.renderTexture.bind(this);
    this.getTextureDataUrl = this.getTextureDataUrl.bind(this);
    this.renderCompresedTexture = this.renderCompresedTexture.bind(this);
    this.renderImageTexture = this.renderImageTexture.bind(this);
    this.renderTextureError = this.renderTextureError.bind(this);
    this.setupSupportedFormats = this.setupSupportedFormats.bind(this);
  }

  async componentDidMount() {
    this.setupSupportedFormats();
    const dataUrl = await this.getTextureDataUrl();
    this.setState({dataUrl});
  }

  setupSupportedFormats() {
    const {gl} = this.props;

    this.setState({
      dxtSupported: Boolean(gl.getExtension('WEBGL_compressed_texture_s3tc')),
      pvrtcSupported: Boolean(gl.getExtension('WEBGL_compressed_texture_pvrtc')),
      atcSupported: Boolean(gl.getExtension('WEBGL_compressed_texture_atc')),
      etc1Supported: Boolean(gl.getExtension('WEBGL_compressed_texture_etc1'))
    });
  }

  async getTextureDataUrl() {
    const {loadOptions} = this.state;
    const {canvas, gl, program, image} = this.props;
    const {src} = image;

    try {
      const loader = await selectLoader(src, [_CompressedTextureLoader, BasisLoader, ImageLoader]);
      const result = await load(src, loader, loadOptions);

      switch (loader.name) {
        case 'CompressedTexture': {
          this.renderCompresedTexture(gl, program, result, loader.name, src);
          break;
        }
        case 'Images': {
          this.renderImageTexture(gl, program, result);
          break;
        }
        case 'Basis': {
          const basisTextures = result[0];
          this.renderCompresedTexture(gl, program, basisTextures, loader.name, src);
          break;
        }
        default: {
          this.renderTextureError(gl, program, 'No available loader for this texture');
        }
      }
    } catch (error) {
      console.error(error); // eslint-disable-line
      this.renderTextureError(gl, program, error);
    }

    return canvas.toDataURL();
  }

  renderTexture(dataUrl, header) {
    const {textureError} = this.state;

    return (
      <TextureButton style={{backgroundImage: `url(${dataUrl})`}}>
        {!textureError ? (
          <ImageFormatHeader>{header}</ImageFormatHeader>
        ) : (
          <ErrorFormatHeader style={{color: 'red'}}>{textureError}</ErrorFormatHeader>
        )}
      </TextureButton>
    );
  }

  // eslint-disable-next-line max-params
  renderCompresedTexture(gl, program, images, loaderName, texturePath) {
    if (!images || !images.length) {
      throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
    }

    if (this.state.dxtSupported) {
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

    if (!this.isFormatSupported(images[0].format)) {
      throw new Error('Texture format not supported');
    }

    gl.useProgram(program);
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    try {
      for (let index = 0; index < images.length; ++index) {
        const image = images[index];
        const {width, height, format, data} = image;

        gl.compressedTexImage2D(gl.TEXTURE_2D, index, format, width, height, 0, data);
      }
    } catch (error) {
      console.error(error); // eslint-disable-line
      this.renderTextureError(gl, program, error);
    }

    if (images.length > 1) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

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

  renderTextureError(gl, program, error) {
    gl.useProgram(program);
    const texture = gl.createTexture();
    const brownColor = new Uint8Array([68, 0, 0, 255]);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, brownColor); // eslint-disable-line
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 8);
    this.setState({textureError: error.message});
  }

  // eslint-disable-next-line complexity
  isFormatSupported(format) {
    if (typeof format !== 'number') {
      throw new Error('Invalid internal format of compressed texture');
    }

    switch (format) {
      case COMPRESSED_RGB_S3TC_DXT1_EXT:
      case COMPRESSED_RGBA_S3TC_DXT3_EXT:
      case COMPRESSED_RGBA_S3TC_DXT5_EXT:
      case COMPRESSED_RGBA_S3TC_DXT1_EXT:
        return this.state.dxtSupported;

      case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
        return this.state.pvrtcSupported;

      case COMPRESSED_RGB_ATC_WEBGL:
      case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
      case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
        return this.state.atcSupported;

      case COMPRESSED_RGB_ETC1_WEBGL:
        return this.state.etc1Supported;

      default:
        return false;
    }
  }

  render() {
    const {dataUrl} = this.state;
    const {image} = this.props;

    return dataUrl ? this.renderTexture(dataUrl, image.format) : null;
  }
}

CompressedTexture.propTypes = propTypes;
CompressedTexture.defaultProps = defaultProps;
