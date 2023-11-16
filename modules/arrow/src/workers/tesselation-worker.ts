import {createWorker} from '@loaders.gl/worker-utils';

// Compressors

createWorker(async (data, options = {}) => {
  const operation = getOperation(String(options?.operation));

  // @ts-ignore
  switch (operation) {
    case 'tessellate':
      return await tessellateBatch(data);
    default:
      throw new Error('invalid option');
  }
});

function getOperation(operation: string): 'tessellate' {
  switch (operation) {
    case 'tessellate':
      return 'tessellate';
    default:
      throw new Error(
        `TesselationWorker: Unsupported operation ${operation}. Expected 'tessellate'`
      );
  }
}

function tessellateBatch(data?) {
  // Parse any WKT/WKB geometries
  // Build binary geometries
  // Call earcut and tessellate
  console.error('TessellationWorker: tessellating batch', data);
  return {};
}
