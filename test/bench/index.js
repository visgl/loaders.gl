/* eslint-disable @typescript-eslint/no-var-requires */

// Sets up aliases for file reader
require('reify');

require('@loaders.gl/polyfills');

// Sets up aliases for file reader
const ALIASES = require('../aliases');
const {_addAliases} = require('@loaders.gl/loader-utils');
_addAliases(ALIASES);

require('./bench-modules');
