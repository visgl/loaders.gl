import './javascript-utils/text-encoder.spec';
import './javascript-utils/binary-utils.spec';
import './javascript-utils/is-type.spec';

import './iterator-utils/async-iterator-to-stream.spec';
import './iterator-utils/chunk-iteration.spec';
import './iterator-utils/async-iteration.spec';
import './iterator-utils/stream-iteration.spec';

import './lib/utils/mime-type-utils.spec';
import './lib/utils/resource-utils.spec';

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
