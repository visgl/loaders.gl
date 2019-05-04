export {default as ArrowLoader} from './arrow-loader';

export {default as ArrowTableBatch} from './lib/arrow-table-batch';

// DEPRECATED

// eslint-disable-next-line import/first
import ArrowLoader from './lib/parse-arrow-sync';

const DEPRECATION_WARNING = `\
ArrowWorkerLoader must be imported from @loaders.gl/arrow/arrow-loader. \
Using ArrowLoader instead`;

export const ArrowWorkerLoader = {
  ...ArrowLoader,
  parseSync: (arrayBuffer, options) => {
    // eslint-disable-next-line no-console, no-undef
    console.warn(DEPRECATION_WARNING);
    return ArrowLoader.parseSync(arrayBuffer, options);
  }
};
