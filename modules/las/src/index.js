export {default as LASLoader} from './las-loader';

// DEPRECATED

// eslint-disable-next-line import/first
import LASLoader from './las-loader';

const DEPRECATION_WARNING = `\
LASWorkerLoader must be imported from @loaders.gl/las/worker-loader. \
Using LASLoader instead`;

export const LASWorkerLoader = {
  ...LASLoader,
  parseSync: (arrayBuffer, options) => {
    // eslint-disable-next-line no-console, no-undef
    console.warn(DEPRECATION_WARNING);
    return LASLoader.parseSync(arrayBuffer, options);
  }
};
