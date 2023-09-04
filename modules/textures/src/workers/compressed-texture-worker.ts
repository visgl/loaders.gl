import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {CompressedTextureLoader} from '../compressed-texture-loader';

// @ts-expect-error
createLoaderWorker(CompressedTextureLoader);
