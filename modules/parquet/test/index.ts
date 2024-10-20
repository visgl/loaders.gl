// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './init';

// parquetjs unit test suite
import './parquetjs/codec-plain.spec';
import './parquetjs/codec-rle.spec';
import './parquetjs/schema.spec';
import './parquetjs/shred.spec';
import './parquetjs/thrift.spec';
import './parquetjs/reader.spec';

// The integration spec runs tens of thousands of detailed tests. Too slow for CI, uncomment to run.
// import './parquetjs/integration.spec';

// loader/writer
import './parquet-loader.spec';
import './parquet-writer.spec';

import './parquet-json-loader.spec';
import './geoparquet-loader.spec';
// import './parquet-json-columnar-loader.spec';

