// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {ImageBitmapLoader, getImageData} from '@loaders.gl/images';
import {makeTerrainMeshFromImage} from '@loaders.gl/terrain';

const MAPBOX_TERRAIN_PNG_URL = '@loaders.gl/terrain/test/data/mapbox.png';
const PROJECTED_BOUNDS = [83, 329.5, 83.125, 329.625];
const LNGLAT_BOUNDS = [-122.523, 37.649, -122.356, 37.815];
const MAPBOX_ELEVATION_DECODER = {
  rScaler: 65536 * 0.1,
  gScaler: 256 * 0.1,
  bScaler: 0.1,
  offset: -10000
};

/**
 * Adds terrain mesh generation benchmarks that compare the new fixed grid path
 * with the existing adaptive strategies on the same decoded terrain tile.
 *
 * @param {import('@probe.gl/bench').Bench} suite Benchmark suite.
 * @returns {Promise<void>} Resolves after benchmarks are added.
 */
export default async function terrainLoaderBench(suite) {
  const response = await fetchFile(MAPBOX_TERRAIN_PNG_URL);
  const arrayBuffer = await response.arrayBuffer();
  const image = await parse(arrayBuffer.slice(0), ImageBitmapLoader);
  const imageData = getImageData(image);
  const terrainImage = {
    width: imageData.width,
    height: imageData.height,
    data:
      imageData.data instanceof Uint8ClampedArray
        ? new Uint8Array(
            imageData.data.buffer,
            imageData.data.byteOffset,
            imageData.data.byteLength
          )
        : imageData.data
  };

  const options = {unit: 'tiles'};

  // Warm up the tesselators outside the timed benchmark loop.
  makeTerrainMeshFromImage(terrainImage, {
    elevationDecoder: MAPBOX_ELEVATION_DECODER,
    meshMaxError: 5,
    bounds: PROJECTED_BOUNDS,
    tesselator: 'auto'
  });
  makeTerrainMeshFromImage(terrainImage, {
    elevationDecoder: MAPBOX_ELEVATION_DECODER,
    meshMaxError: 5,
    bounds: PROJECTED_BOUNDS,
    tesselator: 'delatin'
  });
  makeTerrainMeshFromImage(terrainImage, {
    elevationDecoder: MAPBOX_ELEVATION_DECODER,
    meshMaxError: 5,
    bounds: LNGLAT_BOUNDS,
    tesselator: 'grid',
    gridSize: 33
  });

  suite.group('TerrainLoader: terrain tile mesh generation');

  suite.add('makeTerrainMeshFromImage(auto/martini)', options, () => {
    makeTerrainMeshFromImage(terrainImage, {
      elevationDecoder: MAPBOX_ELEVATION_DECODER,
      meshMaxError: 5,
      bounds: PROJECTED_BOUNDS,
      tesselator: 'auto'
    });
  });

  suite.add('makeTerrainMeshFromImage(delatin)', options, () => {
    makeTerrainMeshFromImage(terrainImage, {
      elevationDecoder: MAPBOX_ELEVATION_DECODER,
      meshMaxError: 5,
      bounds: PROJECTED_BOUNDS,
      tesselator: 'delatin'
    });
  });

  suite.add('makeTerrainMeshFromImage(grid-33)', options, () => {
    makeTerrainMeshFromImage(terrainImage, {
      elevationDecoder: MAPBOX_ELEVATION_DECODER,
      meshMaxError: 5,
      bounds: LNGLAT_BOUNDS,
      tesselator: 'grid',
      gridSize: 33
    });
  });
}
