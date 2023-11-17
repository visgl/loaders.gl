import {createWorker} from '@loaders.gl/worker-utils';
import {getTriangleIndices} from '../geoarrow/convert-geoarrow-to-binary-geometry';
import type {TessellationWorkerInput, TessellationWorkerOutput} from '../tessellate-on-worker';

// Compressors

createWorker(async (data, options = {}) => {
  switch (options?.operation) {
    case 'test':
      return data;
    case 'tessellate':
      return await tessellateBatch(data as TessellationWorkerInput);
    default:
      throw new Error(
        `TesselationWorker: Unsupported operation ${options?.operation}. Expected 'tessellate'`
      );
  }
});
function tessellateBatch(data: TessellationWorkerInput): TessellationWorkerOutput {
  // Parse any WKT/WKB geometries
  // Build binary geometries
  // Call earcut and tessellate
  console.error('TessellationWorker: tessellating batch', data);
  const triangleIndices = getTriangleIndices(
    data.polygonIndices,
    data.primitivePolygonIndices,
    data.flatCoordinateArray,
    data.nDim
  );
  return {...data, triangleIndices};
}
