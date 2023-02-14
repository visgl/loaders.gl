import {preloadCompressions} from '@loaders.gl/parquet';

// Import big dependencies

// import brotli from 'brotli'; - brotli has problems with decompress in browsers
import brotliDecompress from 'brotli/decompress';
import lzo from 'lzo';


// Inject large dependencies through Compression constructor options
const modules = {
  // brotli has problems with decompress in browsers
  brotli: {
    decompress: brotliDecompress,
    compress: () => {
      throw new Error('brotli compress');
    }
  },
  lzo,
};

// Start loading compression modules in the background to minimize 
// time spent during test case execution
// eslint-disable-next-line @typescript-eslint/no-misused-promises
preloadCompressions({modules});
