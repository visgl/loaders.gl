import {createWorker} from '@loaders.gl/worker-utils';

// Compressors

createWorker(async (data, options = {}) => {
  const operation = getOperation(String(options?.operation));

  // @ts-ignore
  switch (operation) {
    case 'tesselate':
      return await tesselateBatch(data);
    default:
      throw new Error('invalid option');
  }
});

function getOperation(operation: string): 'tesselate' {
  switch (operation) {
    case 'tesselate':
      return 'tesselate';
    default:
      throw new Error(
        `@loaders.gl/compression: Unsupported operation ${operation}. Expected 'compress' or 'decompress'`
      );
  }
}

function tesselateBatch(data?) {
  // Parse any WKT/WKB geometries

  // Build binary geometries

  // Call earcut and tesselate
}
