// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageDataType} from '@loaders.gl/images';
import {extractLoadLibraryOptions} from '@loaders.gl/worker-utils';
import {loadBasisEncoderModule} from '../parsers/basis-module-loader';
import {type KTX2BasisWriterOptions} from '../../ktx2-basis-writer';

/**
 * Encodes image to Basis Universal Supercompressed GPU Texture.
 * Code example is taken from here - https://github.com/BinomialLLC/basis_universal/blob/master/webgl/ktx2_encode_test/index.html#L279
 * BasisEncoder API - https://github.com/BinomialLLC/basis_universal/blob/master/webgl/transcoder/basis_wrappers.cpp#L1712
 * @param image
 * @param options
 */
export async function encodeKTX2BasisTexture(
  image: ImageDataType,
  options: KTX2BasisWriterOptions = {}
): Promise<ArrayBuffer> {
  // TODO remove default values after writer options will be normalized like it done in load module.
  const {
    useSRGB = false,
    qualityLevel = 10,
    encodeUASTC = false,
    mipmaps = false
  } = options?.['ktx2-basis-writer'] || {};
  const {BasisEncoder} = await loadBasisEncoderModule(extractLoadLibraryOptions(options));
  const basisEncoder = new BasisEncoder();

  try {
    // Include container overhead even for the smallest source images.
    const basisFileData = new Uint8Array(image.width * image.height * 4 + 65536);
    basisEncoder.setCreateKTX2File(true);
    basisEncoder.setKTX2UASTCSupercompression(true);
    if (basisEncoder.setKTX2AndBasisSRGBTransferFunc) {
      basisEncoder.setKTX2AndBasisSRGBTransferFunc(true);
    } else {
      // Preserve compatibility with injected pre-v2.50 encoder modules.
      basisEncoder.setKTX2SRGBTransferFunc(true);
    }

    basisEncoder.setSliceSourceImage(0, image.data, image.width, image.height, false);
    basisEncoder.setPerceptual(useSRGB);
    basisEncoder.setMipSRGB(useSRGB);
    basisEncoder.setQualityLevel(qualityLevel);
    basisEncoder.setUASTC(encodeUASTC);
    basisEncoder.setMipGen(mipmaps);

    const numOutputBytes = basisEncoder.encode(basisFileData);

    if (!numOutputBytes || numOutputBytes > basisFileData.length) {
      throw new Error('Basis encoder failed to encode the source image');
    }
    const actualKTX2FileData = basisFileData.slice(0, numOutputBytes).buffer;
    return actualKTX2FileData;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Basis Universal Supercompressed GPU Texture encoder Error: ', error);
    throw error;
  } finally {
    basisEncoder.delete();
  }
}
