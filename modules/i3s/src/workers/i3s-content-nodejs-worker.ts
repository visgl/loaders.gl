import {createLoaderWorker} from '@loaders.gl/loader-utils';
import '@loaders.gl/polyfills';
import {I3SContentLoader} from '../i3s-content-loader';

createLoaderWorker(I3SContentLoader);
