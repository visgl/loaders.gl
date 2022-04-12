import {createWorker} from '@loaders.gl/worker-utils';
import B3dmConverter from '../3d-tiles-converter/helpers/b3dm-converter';

const b3dmConverter = new B3dmConverter();

createWorker(async (data, options = {}) => b3dmConverter.convert(data, options.attributes));
