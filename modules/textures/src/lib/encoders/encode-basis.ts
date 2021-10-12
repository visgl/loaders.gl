import type {ImageDataType} from '@loaders.gl/images';
import {loadBasisEncoderModule} from '../parsers/basis-module-loader';

/**
 * Encodes image to basis texture
 * Code example is taken from here - https://github.com/BinomialLLC/basis_universal/blob/master/webgl/encode_test/index.html#L413
 * BasisEncoder API is taken from here - https://github.com/BinomialLLC/basis_universal/blob/master/webgl/transcoder/basis_wrappers.cpp#L1712
 * @param image
 * @param options
 */
export default async function encodeBasis(image: ImageDataType, options: any): Promise<Uint8Array> {
  const {useSRGB = false, qualityLevel = 10, encodeUASTC = false, mipmaps = false} = options;

  try {
    const {BasisEncoder} = await loadBasisEncoderModule(options);

    const basisFileData = new Uint8Array(image.width * image.height * 4);
    const basisEncoder = new BasisEncoder();

    basisEncoder.setSliceSourceImage(0, image.data, image.width, image.height, false);
    basisEncoder.setPerceptual(useSRGB);
    basisEncoder.setMipSRGB(useSRGB);
    basisEncoder.setQualityLevel(qualityLevel);
    basisEncoder.setUASTC(encodeUASTC);
    basisEncoder.setMipGen(mipmaps);

    const numOutputBytes = basisEncoder.encode(basisFileData);
    const actualBasisFileData = new Uint8Array(basisFileData.buffer, 0, numOutputBytes);

    basisEncoder.delete();

    return actualBasisFileData;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Basis Encoder Error: ', error);
    throw error;
  }
}
