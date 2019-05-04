export {default as OBJLoader} from './obj-loader';

// DEPRECATED

// eslint-disable-next-line import/first
import OBJLoader from './obj-loader';

const DEPRECATION_WARNING = `\
OBJWorkerLoader must be imported from @loaders.gl/obj/worker-loader. \
Using OBJLoader instead`;

export const OBJWorkerLoader = {
  ...OBJLoader,
  parseTextSync: text => {
    // eslint-disable-next-line no-console, no-undef
    console.warn(DEPRECATION_WARNING);
    return OBJLoader.parseTextSync(text);
  }
};
