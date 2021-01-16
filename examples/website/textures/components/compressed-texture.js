import React, {PureComponent} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {BasisLoader, CompressedTextureLoader, CrunchLoader} from '@loaders.gl/textures';
import {ImageLoader} from '@loaders.gl/images';
import {load, registerLoaders, selectLoader, fetchFile} from '@loaders.gl/core';
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

const TEXTURES_BASE_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/textures/test/data/';

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

const propTypes = {
  canvas: PropTypes.object,
  image: PropTypes.object,
  gl: PropTypes.object,
  program: PropTypes.object
};

const defaultProps = {
  canvas: null,
  image: null,
  gl: null,
  program: null
};

export default class CompressedTexture extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      supportedFormats: this.getSupportedFormats(props.gl),
      // Temporary decision to disable worker untill texture module will be published to npm
      loadOptions: {basis: {}, worker: false},
      textureError: null,
      showStats: false,
      stats: []
    };
  }

  async componentDidMount() {
    await this.setupBasisLoadOptionsIfNeeded();

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
    if (this.state.supportedFormats.DXT) {
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

  // eslint-disable-next-line max-statements
  async getTextureDataUrl() {
    const {loadOptions} = this.state;
    const {canvas, gl, program, image} = this.props;
    const {src} = image;

    try {
      const url = `${TEXTURES_BASE_URL}${src}`;
      const loader = await selectLoader(url, [
        CompressedTextureLoader,
        CrunchLoader,
        BasisLoader,
        ImageLoader
      ]);

      const response = await fetchFile(url);
      const arrayBuffer = await response.arrayBuffer();
      const length = arrayBuffer.byteLength;
      const result = loader && (await load(arrayBuffer, loader, loadOptions));

      this.addStat('File Size', Math.floor(length / 1024), 'Kb');

      switch (loader && loader.name) {
        case 'Crunch':
        case 'CompressedTexture':
          this.renderEmptyTexture(gl, program);
          this.renderCompressedTexture(gl, program, result, loader.name, src);
          break;
        case 'Images':
          this.renderEmptyTexture(gl, program);
          this.renderImageTexture(gl, program, result);
          break;
        case 'Basis':
          const basisTextures = result[0];
          this.renderEmptyTexture(gl, program);
          this.renderCompressedTexture(gl, program, basisTextures, loader.name, src);
          break;
        default:
          throw new Error('Unknown texture loader');
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
    const lumaTexture = new Texture2D(gl, {
      data: image,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      }
    });

    gl.useProgram(program);

    gl.bindTexture(gl.TEXTURE_2D, lumaTexture.handle);
    const startTime = new Date();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const uploadTime = Date.now() - startTime;

    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${image.width} x ${image.height}`);
    this.addStat(
      'Size in memory (Lvl 0)',
      Math.floor((image.width * image.height * 4) / 1024),
      'Kb'
    );
  }

  renderCompressedTexture(gl, program, images, loaderName, texturePath) {
    if (!images || !images.length) {
      throw new Error(`${loaderName} loader doesn't support texture ${texturePath} format`);
    }
    // We take the first image because it has main propeties of compressed image.
    const {format, width, height, levelSize} = images[0];

    if (!this.isFormatSupported(format)) {
      throw new Error(`Texture format ${format} not supported by this GPU`);
    }

    const startTime = new Date();
    const texture = this.createCompressedTexture2D(gl, images);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.useProgram(program);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const uploadTime = Date.now() - startTime;

    this.addStat('Upload time', `${Math.floor(uploadTime)} ms`);
    this.addStat('Dimensions', `${width} x ${height}`);
    if (levelSize) {
      this.addStat('Size in memory (Lvl 0)', Math.floor(levelSize / 1024), 'Kb');
    }
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
        <li key={index}>{`${stats[index].name}: ${stats[index].value}${stats[index].units}`}</li>
      );
    }
    return <TextureInfo style={{opacity: this.state.showStats ? 0.8 : 0}}>{infoList}</TextureInfo>;
  }

  render() {
    const {dataUrl, textureError} = this.state;
    const {format} = this.props.image;

    return dataUrl ? (
      <TextureButton
        style={{backgroundImage: `url(${dataUrl})`}}
        onMouseEnter={() => this.setState({showStats: true})}
        onMouseLeave={() => this.setState({showStats: false})}
      >
        {!textureError ? (
          <ImageFormatHeader>{format}</ImageFormatHeader>
        ) : (
          <ErrorFormatHeader style={{color: 'red'}}>{textureError}</ErrorFormatHeader>
        )}
        {this.renderStats()}
      </TextureButton>
    ) : null;
  }
}

CompressedTexture.propTypes = propTypes;
CompressedTexture.defaultProps = defaultProps;
