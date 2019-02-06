import parseArrow from './parse-arrow';

const DEFAULT_OPTIONS = {};

export default {
  name: 'Apache Arrow',
  extension: 'arrow',
  parseBinary: parseArrow,
  DEFAULT_OPTIONS
};
