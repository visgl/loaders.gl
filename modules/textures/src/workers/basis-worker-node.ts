// Polyfills increases the bundle size significantly. Use it for NodeJS worker only
import '@loaders.gl/polyfills';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {BasisLoader} from '../basis-loader';

createLoaderWorker(BasisLoader);
