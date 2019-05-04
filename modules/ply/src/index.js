// Import the worker bundled by webpack
export {default as PLYLoader} from './ply-loader';

// TODO - PLYStreamLoader should eventually merge with/replace PLYLoader
export {default as _PLYStreamLoader} from './ply-stream-loader';

// DEPRECATED

// eslint-disable-next-line import/first
import PLYLoader from './ply-loader';

const DEPRECATION_WARNING = `\
PLYWorkerLoader must be imported from @loaders.gl/ply/worker-loader. \
Using PLYLoader instead`;

export const PLYWorkerLoader = {
  ...PLYLoader,
  parseSync: (arrayBuffer, options) => {
    // eslint-disable-next-line no-console, no-undef
    console.warn(DEPRECATION_WARNING);
    return PLYLoader.parseSync(arrayBuffer, options);
  }
};
