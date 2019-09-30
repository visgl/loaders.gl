import './javascript-utils';

import './lib/fetch';
import './lib/loader-utils';
import './lib/progress/fetch-progress.spec';

import './lib/parse.spec';
import './lib/load.spec';
import './lib/register-loaders.spec';
import './lib/select-loader.spec';

// TODO - The worker-utils specs test loading, not just worker farm
// so we run them after util tests, until loading has been split out
import './worker-utils';
