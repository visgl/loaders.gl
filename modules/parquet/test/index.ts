import './init';

import './buffer-polyfill';

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


import './parquet-wasm-loader.spec';

import './parquet-columnar-loader.spec';

import './geoparquet-loader.spec';
