import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {CrunchWorkerLoader} from '../crunch-loader';
import {parseCrunch} from '../lib/parsers/parse-crunch';

/**
 * Loader for the Crunch compressed texture container format
 */
export const CrunchLoader = {
  ...CrunchWorkerLoader,
  parse: parseCrunch
};

createLoaderWorker(CrunchLoader);
