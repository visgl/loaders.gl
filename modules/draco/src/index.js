export {default as DracoLoader} from './draco-loader';
export {default as DracoWriter} from './draco-writer';

export {default as DracoParser} from './draco-parser';
export {default as DracoBuilder} from './draco-builder';

// DEPRECATED

// eslint-disable-next-line import/first
import DracoParser from './draco-parser';

const DEPRECATION_WARNING = `\
DracoWorkerLoader must be imported from @loaders.gl/draco/worker-loader. \
Using DracoLoader instead`;

function parseSync(arrayBuffer, options) {
  // eslint-disable-next-line no-console, no-undef
  console.warn(DEPRECATION_WARNING);
  const dracoParser = new DracoParser();
  try {
    return dracoParser.parseSync(arrayBuffer, options);
  } finally {
    dracoParser.destroy();
  }
}

export const DracoWorkerLoader = {
  name: 'DRACO',
  extensions: ['drc'],
  parseSync
};
