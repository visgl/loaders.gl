import {BasisFormat} from '../basis-loader';
import {loadBasisModule} from './basis-module-loader';

function transcodeImage(basisFile, imageIndex, levelIndex, options) {
  const width = basisFile.getImageWidth(imageIndex, levelIndex);
  const height = basisFile.getImageHeight(imageIndex, levelIndex);

  // See https://github.com/BinomialLLC/basis_universal/pull/83
  const hasAlpha = basisFile.getHasAlpha(/* imageIndex, levelIndex */);

  let format = (options && options.format) || BasisFormat.cTFRGB565;
  if (typeof format === 'object') {
    format = hasAlpha ? format.alpha : format.noAlpha;
  }

  const decodedSize = basisFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, format);
  const decodedData = new Uint8Array(decodedSize);

  if (!basisFile.transcodeImage(decodedData, imageIndex, levelIndex, format, 0, 0)) {
    return null;
  }

  return {width, height, hasAlpha, format, decodedSize, decodedData};
}

async function parse(data, options) {
  const {BasisFile} = await loadBasisModule(options);
  const basisFile = new BasisFile(new Uint8Array(data));

  try {
    if (!basisFile.startTranscoding()) {
      return null;
    }

    const imageCount = basisFile.getNumImages();
    const images = [];

    for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
      const levelsCount = basisFile.getNumLevels(imageIndex);
      const levels = [];

      for (let levelIndex = 0; levelIndex < levelsCount; levelIndex++) {
        levels.push(transcodeImage(basisFile, imageIndex, levelIndex, options));
      }

      images.push(levels);
    }

    return images;
  } finally {
    basisFile.close();
    basisFile.delete();
  }
}

export default parse;
