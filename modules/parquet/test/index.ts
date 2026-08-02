// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import './init';
import './make-stream-iterator.spec';

// parquetjs unit test suite
import './parquetjs/codec-plain.spec';
import './parquetjs/codec-rle.spec';
import './parquetjs/codec-delta.spec';
import './parquetjs/schema.spec';
import './parquetjs/shred.spec';
import './parquetjs/thrift.spec';
import './parquetjs/reader.spec';

// The integration spec runs tens of thousands of detailed tests. Too slow for CI, uncomment to run.
// import './parquetjs/integration.spec';

// loader/writer
import './parquet-arrow-loader.spec';
import './parquet-arrow-writer.spec';
import './parquet-source-loader.spec';
import './parquet-source-capabilities.spec';

import './parquet-loader.spec';
import './geoparquet-loader.spec';
import './parquet-typed-array.spec';
import './parquet-compatibility.spec';
