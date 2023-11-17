import {createWorker} from '@loaders.gl/worker-utils';
import {getTriangleIndices} from '../geoarrow/convert-geoarrow-to-binary-geometry';
import type {TriangulationWorkerInput, TriangulationWorkerOutput} from '../triangulate-on-worker';

// Compressors

createWorker(async (data, options = {}) => {
  switch (options?.operation) {
    case 'test':
      return data;
    case 'triangulate':
      return await triangulateBatch(data as TriangulationWorkerInput);
    default:
      throw new Error(
        `TesselationWorker: Unsupported operation ${options?.operation}. Expected 'triangulate'`
      );
  }
});
function triangulateBatch(data: TriangulationWorkerInput): TriangulationWorkerOutput {
  // Parse any WKT/WKB geometries
  // Build binary geometries
  // Call earcut and triangulate
  console.error('TriangulationWorker: tessellating batch', data);
  const triangleIndices = getTriangleIndices(
    data.polygonIndices,
    data.primitivePolygonIndices,
    data.flatCoordinateArray,
    data.nDim
  );
  return {...data, triangleIndices};
}
