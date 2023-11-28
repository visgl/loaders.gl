// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import {createWorker} from '@loaders.gl/worker-utils';
import {getTriangleIndices} from '../geoarrow/convert-geoarrow-to-binary-geometry';
import type {
  TriangulationWorkerInput,
  TriangulateInput,
  TriangulateResult
} from '../triangulate-on-worker';

createWorker(async (data, options = {}) => {
  const input = data as TriangulationWorkerInput;
  const operation = input?.operation;
  switch (operation) {
    case 'test':
      return input;
    case 'triangulate':
      return triangulateBatch(data);
    default:
      throw new Error(
        `TriangulationWorker: Unsupported operation ${operation}. Expected 'triangulate'`
      );
  }
});

function triangulateBatch(data: TriangulateInput): TriangulateResult {
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
  return {...data, ...(triangleIndices ? {triangleIndices} : {})};
}
