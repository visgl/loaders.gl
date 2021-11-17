import type {ImageDataType} from '@loaders.gl/images';
import {loadBasisEncoderModule} from '../parsers/basis-module-loader';

/**
 * Encodes image to Basis Universal Supercompressed GPU Texture.
 * Code example is taken from here - https://github.com/BinomialLLC/basis_universal/blob/master/webgl/ktx2_encode_test/index.html#L279
 * BasisEncoder API - https://github.com/BinomialLLC/basis_universal/blob/master/webgl/transcoder/basis_wrappers.cpp#L1712
 * @param image
 * @param options
 */
export async function encodeKTX2BasisTexture(
  image: ImageDataType,
  options: any = {}
): Promise<ArrayBuffer> {
  // TODO remove default values after writer options will be normalized like it done in load module.
  const {useSRGB = false, qualityLevel = 10, encodeUASTC = false, mipmaps = false} = options;
  const {BasisEncoder} = await loadBasisEncoderModule(options);
  const basisEncoder = new BasisEncoder();

  try {
    const basisFileData = new Uint8Array(image.width * image.height * 4);
    basisEncoder.setCreateKTX2File(true);
    basisEncoder.setKTX2UASTCSupercompression(true);
    basisEncoder.setKTX2SRGBTransferFunc(true);

    basisEncoder.setSliceSourceImage(0, image.data, image.width, image.height, false);
    basisEncoder.setPerceptual(useSRGB);
    basisEncoder.setMipSRGB(useSRGB);
    basisEncoder.setQualityLevel(qualityLevel);
    basisEncoder.setUASTC(encodeUASTC);
    basisEncoder.setMipGen(mipmaps);

    const numOutputBytes = basisEncoder.encode(basisFileData);

    const actualKTX2FileData = basisFileData.subarray(0, numOutputBytes).buffer;
    return actualKTX2FileData;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Basis Universal Supercompressed GPU Texture encoder Error: ', error);
    throw error;
  } finally {
    basisEncoder.delete();
  }
}
