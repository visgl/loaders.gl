import '@loaders.gl/polyfills';
export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {BasisLoaderWithParser} from '../basis-loader-with-parser';
import {CompressedTextureLoaderWithParser} from '../compressed-texture-loader-with-parser';
import {CrunchLoader} from '../crunch-loader';
import {NPYLoaderWithParser} from '../npy-loader-with-parser';
import {parseCrunch} from '../lib/parsers/parse-crunch';

const CrunchLoaderWithParser = {
  ...CrunchLoader,
  parse: parseCrunch
};

createLoaderWorker({
  basis: BasisLoaderWithParser,
  'compressed-texture': CompressedTextureLoaderWithParser,
  crunch: CrunchLoaderWithParser,
  npy: NPYLoaderWithParser
});
