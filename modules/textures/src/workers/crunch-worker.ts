import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {CrunchLoader} from '../crunch-loader';
import {parseCrunch} from '../lib/parsers/parse-crunch';

/**
 * Loader for the Crunch compressed texture container format
 */
export const CrunchLoaderWithParser = {
  ...CrunchLoader,
  parse: parseCrunch
};

createLoaderWorker(CrunchLoaderWithParser);
