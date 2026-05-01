// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASLoader

export {LASFormat} from './las-format';

export type {LASLoaderOptions} from './las-loader';

export type {LASWriterOptions} from './las-writer';
export {LASWriter} from './las-writer';

// Export the laz-perf based loader as default LASLoader until we have done more testing
export {LAZPerfLoader as LASLoader} from './lazperf-loader';
export {LASArrowLoader} from './las-arrow-loader';

// Implementation specific loaders, for bench marking and testing
export {LAZPerfLoader} from './lazperf-loader';
export {LAZRsLoader} from './laz-rs-loader';

// DEPRECATED EXPORTS
/** @deprecated Use LASLoader. */
export {LASWorkerLoader} from './las-loader';
