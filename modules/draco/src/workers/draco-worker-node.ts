// Polyfills increases the bundle size significantly. Use it for NodeJS worker only
import '@loaders.gl/polyfills';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {DracoLoader} from '../index';

createLoaderWorker(DracoLoader);
