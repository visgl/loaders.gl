import './javascript-utils';

import './lib/fetch';
import './lib/loader-utils';
import './lib/progress/fetch-progress.spec';

import './lib/parse.spec';
import './lib/load.spec';
import './lib/register-loaders.spec';
import './lib/select-loader.spec';

// TODO - Worker utils tests test loading, not just worker farm
// so we keep them after util tests
import './worker-utils';

import './deprecated/create-read-stream.spec';
