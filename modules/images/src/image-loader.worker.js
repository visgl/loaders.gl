import ImageLoader from './image-loader';
import {createWorker} from '@loaders.gl/loader-utils';

// TODO - Can createWorker handle an array of loaders
createWorker(ImageLoader);
