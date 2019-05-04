export {default as PCDLoader} from './pcd-loader';

// DEPRECATED

// eslint-disable-next-line import/first
import PCDLoader from './pcd-loader';

const DEPRECATION_WARNING = `\
PCDWorkerLoader must be imported from @loaders.gl/pcd/worker-loader. \
Using PCDLoader instead`;

export const PCDWorkerLoader = {
  ...PCDLoader,
  parseSync: (arrayBuffer, options) => {
    // eslint-disable-next-line no-console, no-undef
    console.warn(DEPRECATION_WARNING);
    return PCDLoader.parseSync(arrayBuffer, options);
  }
};
