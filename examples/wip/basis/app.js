/* global document, URL */
import {load} from '@loaders.gl/core';
import {BasisLoader} from '@loaders.gl/basis';

const btn = document.createElement('button');
document.body.appendChild(btn);
btn.innerText = 'Load Basis File';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const gl = canvas.getContext('webgl');
const dxtSupported = !!gl.getExtension('WEBGL_compressed_texture_s3tc');

const BASIS_FORMAT = {
  cTFETC1: 0,
  cTFETC2: 1,
  cTFBC1: 2,
  cTFBC3: 3,
  cTFBC4: 4,
  cTFBC5: 5,
  cTFBC7_M6_OPAQUE_ONLY: 6,
  cTFBC7_M5: 7,
  cTFPVRTC1_4_RGB: 8,
  cTFPVRTC1_4_RGBA: 9,
  cTFASTC_4x4: 10,
  cTFATC_RGB: 11,
  cTFATC_RGBA_INTERPOLATED_ALPHA: 12,
  cTFRGBA32: 13,
  cTFRGB565: 14,
  cTFBGR565: 15,
  cTFRGBA4444: 16,
};

btn.addEventListener('click', e => {
  const el = document.createElement('input');
  el.type = 'file';
  el.addEventListener('input', async ev => {
    const url = URL.createObjectURL(ev.target.files[0]);
    const basisFile = await load(url, BasisLoader);

    const width = basisFile.getImageWidth(0, 0);
    const height = basisFile.getImageHeight(0, 0);
    const images = basisFile.getNumImages();
    const levels = basisFile.getNumLevels(0);
    const hasAlpha = basisFile.getHasAlpha();

    let format, formatString;

    if (dxtSupported) {
      if (hasAlpha) {
        format = BASIS_FORMAT.cTFBC3;
        formatString = 'BASIS_FORMAT.cTFBC3';
      } else {
        format = BASIS_FORMAT.cTFBC1;
        formatString = 'BASIS_FORMAT.cTFBC1';
      }
    } else {
      format = BASIS_FORMAT.cTFRGB565;
      formatString = 'BASIS_FORMAT.cTFRGB565';
    }

    console.log({width,height, images, levels, hasAlpha, format, formatString});

    if (basisFile.startTranscoding()) {
      const dstSize = basisFile.getImageTranscodedSizeInBytes(0, 0, format);
      const dst = new Uint8Array(dstSize);

      if (basisFile.transcodeImage(dst, 0, 0, format, 0, 0)) {
        console.log(dst);
      }
    }

    basisFile.close();
    basisFile.delete();
  });
  el.click();
});

