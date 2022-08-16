import {createLoaderWorker} from '@loaders.gl/loader-utils';
import '@loaders.gl/polyfills';
import {DracoLoader} from '../index';

createLoaderWorker(DracoLoader);
