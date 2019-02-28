import parseSync from './parse-arrow-sync';
import {parseArrowAsIterator, parseArrowAsAsyncIterator} from './parse-arrow-async-iterator';

const DEFAULT_OPTIONS = {};

export default {
  name: 'Apache Arrow',
  extension: 'arrow',
  parseSync,
  parseIterator: parseArrowAsIterator,
  parseAsyncIterator: parseArrowAsAsyncIterator,
  DEFAULT_OPTIONS
};
