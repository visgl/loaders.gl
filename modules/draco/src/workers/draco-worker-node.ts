// Polyfills increases the bundle size significantly. Use it for NodeJS worker only
import '@loaders.gl/polyfills';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {DracoLoaderWithParser} from '../draco-loader-with-parser';

createLoaderWorker(DracoLoaderWithParser);
