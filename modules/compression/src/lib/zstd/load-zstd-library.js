import {assert} from '@loaders.gl/loader-utils';

const ERR_ZSTD_LIBRARY_NOT_SUPPLIED = `zstd-codec lib must be supplied in options.module['zstd-codec']`;

/**
 * zstd-codec is an injectable dependency due to big size
 * @param {object} options
 */
export async function loadZstdLibrary(options) {
  options = {modules: {}};

  const ZstdCodec = options.modules['zstd-codec'];
  assert(ZstdCodec, ERR_ZSTD_LIBRARY_NOT_SUPPLIED);

  return ZstdCodec;
}
