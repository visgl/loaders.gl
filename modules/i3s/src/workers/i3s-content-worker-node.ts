// Polyfills increases the bundle size significantly. Use it for NodeJS worker only
import '@loaders.gl/polyfills';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {I3SContentLoaderWithParser} from '../i3s-content-loader-with-parser';

createLoaderWorker(I3SContentLoaderWithParser);
