import './javascript-utils/text-encoder.spec';
import './javascript-utils/binary-utils.spec';

import './lib/fetch';
import './lib/loader-utils';
import './lib/progress/fetch-progress.spec';

import './lib/set-loader-options.spec';
import './lib/register-loaders.spec';
import './lib/select-loader.spec';
import './lib/parse.spec';
import './lib/load.spec';

// TODO - The worker-utils specs test loading, not just worker farm
// so we run them after util tests, until loading has been split out
import './worker-utils';
