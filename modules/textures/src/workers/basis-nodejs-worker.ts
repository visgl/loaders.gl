import {createLoaderWorker} from '@loaders.gl/loader-utils';
import '@loaders.gl/polyfills';
import {BasisLoader} from '../basis-loader';

createLoaderWorker(BasisLoader);
