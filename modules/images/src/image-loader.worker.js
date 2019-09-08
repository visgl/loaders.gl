import {ImageLoaders} from './image-loaders';
import {createWorker} from '@loaders.gl/loader-utils';

// TODO - Can createWorker handle an array of loaders
createWorker(ImageLoaders);
