import React, {PureComponent} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {
  BasisLoader,
  CompressedTextureLoader,
  CrunchWorkerLoader,
  GL_CONSTANTS,
  getSupportedGPUTextureFormats
} from '@loaders.gl/textures';
import {ImageLoader} from '@loaders.gl/images';
import {load, registerLoaders, selectLoader, fetchFile} from '@loaders.gl/core';
import {Texture2D} from '@luma.gl/core';

const {
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
  COMPRESSED_RGB_ETC1_WEBGL,
  COMPRESSED_RGBA_ASTC_4X4_KHR,
  COMPRESSED_RGBA_ASTC_5X4_KHR,
  COMPRESSED_RGBA_ASTC_5X5_KHR,
  COMPRESSED_RGBA_ASTC_6X5_KHR,
  COMPRESSED_RGBA_ASTC_6X6_KHR,
  COMPRESSED_RGBA_ASTC_8X5_KHR,
  COMPRESSED_RGBA_ASTC_8X6_KHR,
  COMPRESSED_RGBA_ASTC_8X8_KHR,
  COMPRESSED_RGBA_ASTC_10X5_KHR,
  COMPRESSED_RGBA_ASTC_10X6_KHR,
  COMPRESSED_RGBA_ASTC_10X8_KHR,
  COMPRESSED_RGBA_ASTC_10X10_KHR,
  COMPRESSED_RGBA_ASTC_12X10_KHR,
  COMPRESSED_RGBA_ASTC_12X12_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR,
  COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR,
  COMPRESSED_R11_EAC,
  COMPRESSED_SIGNED,
  COMPRESSED_RG11_EAC,
  COMPRESSED_SIGNED_RG11_EAC,
  COMPRESSED_RGB8_ETC2,
  COMPRESSED_RGBA8_ETC2_EAC,
  COMPRESSED_SRGB8_ETC2,
  COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
  COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  COMPRESSED_RED_RGTC1_EXT,
  COMPRESSED_SIGNED_RED_RGTC1_EXT,
  COMPRESSED_RED_GREEN_RGTC2_EXT,
  COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT,
  COMPRESSED_SRGB_S3TC_DXT1_EXT,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
} = GL_CONSTANTS;

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
      supportedFormats: getSupportedGPUTextureFormats(props.gl),
      loadOptions: {
        basis: {
          workerUrl:
            'https://unpkg.com/@loaders.gl/textures@3.0.0-alpha.4/dist/basis-loader.worker.js'
        }
      },
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

  getExtension(name) {
    const {gl} = this.props;
    const vendorPrefixes = ['', 'WEBKIT_', 'MOZ_'];
    let ext = null;

    for (const index in vendorPrefixes) {
      ext = Boolean(gl.getExtension(vendorPrefixes[index] + name));
      if (ext) {
        break;
      }
    }
    return ext;
  }

  setupBasisLoadOptionsIfNeeded() {
    if (this.state.supportedFormats.has('dxt')) {
      const loadOptions = {
        ...this.state.loadOptions,
        basis: {
          ...this.state.loadOptions.basis,
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

    try {
      const {arrayBuffer, length, src} = await this.getLoadedData(image);
      const loader = await selectLoader(src, [
        CompressedTextureLoader,
        CrunchWorkerLoader,
        BasisLoader,
        ImageLoader
      ]);
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

  async getLoadedData(image) {
    let arrayBuffer = null;
    let length = 0;
    let src = '';

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
    }

    return {arrayBuffer, length, src};
  }

  createCompressedTexture2D(gl, images) {
    const texture = new Texture2D(gl, {
      data: images,
      compressed: true,
      mipmaps: false,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: images.length > 1 ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      }
    });

    return texture.handle;
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
    const {supportedFormats} = this.state;

    switch (format) {
      case COMPRESSED_RGB_S3TC_DXT1_EXT:
      case COMPRESSED_RGBA_S3TC_DXT3_EXT:
      case COMPRESSED_RGBA_S3TC_DXT5_EXT:
      case COMPRESSED_RGBA_S3TC_DXT1_EXT:
        return supportedFormats.has('dxt');

      case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
      case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
      case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
        return supportedFormats.has('pvrtc');

      case COMPRESSED_RGB_ATC_WEBGL:
      case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
      case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
        return supportedFormats.has('atc');

      case COMPRESSED_RGB_ETC1_WEBGL:
        return supportedFormats.has('etc1');

      case COMPRESSED_RGBA_ASTC_4X4_KHR:
      case COMPRESSED_RGBA_ASTC_5X4_KHR:
      case COMPRESSED_RGBA_ASTC_5X5_KHR:
      case COMPRESSED_RGBA_ASTC_6X5_KHR:
      case COMPRESSED_RGBA_ASTC_6X6_KHR:
      case COMPRESSED_RGBA_ASTC_8X5_KHR:
      case COMPRESSED_RGBA_ASTC_8X6_KHR:
      case COMPRESSED_RGBA_ASTC_8X8_KHR:
      case COMPRESSED_RGBA_ASTC_10X5_KHR:
      case COMPRESSED_RGBA_ASTC_10X6_KHR:
      case COMPRESSED_RGBA_ASTC_10X8_KHR:
      case COMPRESSED_RGBA_ASTC_10X10_KHR:
      case COMPRESSED_RGBA_ASTC_12X10_KHR:
      case COMPRESSED_RGBA_ASTC_12X12_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR:
      case COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR:
        return supportedFormats.has('astc');

      case COMPRESSED_R11_EAC:
      case COMPRESSED_SIGNED:
      case COMPRESSED_RG11_EAC:
      case COMPRESSED_SIGNED_RG11_EAC:
      case COMPRESSED_RGB8_ETC2:
      case COMPRESSED_RGBA8_ETC2_EAC:
      case COMPRESSED_SRGB8_ETC2:
      case COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:
      case COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2:
      case COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2:
        return supportedFormats.has('etc2');

      case COMPRESSED_RED_RGTC1_EXT:
      case COMPRESSED_SIGNED_RED_RGTC1_EXT:
      case COMPRESSED_RED_GREEN_RGTC2_EXT:
      case COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT:
        return supportedFormats.has('rgtc');

      case COMPRESSED_SRGB_S3TC_DXT1_EXT:
      case COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT:
      case COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT:
      case COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT:
        return supportedFormats.has('dxt-srgb');
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
    const {format, name} = this.props.image;

    return dataUrl ? (
      <TextureButton
        style={{backgroundImage: `url(${dataUrl})`}}
        onMouseEnter={() => this.setState({showStats: true})}
        onMouseLeave={() => this.setState({showStats: false})}
      >
        {!textureError ? (
          <ImageFormatHeader>{format || name}</ImageFormatHeader>
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
