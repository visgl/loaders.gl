// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, MeshAttributes} from '@loaders.gl/schema';
import {deduceMeshSchema} from '@loaders.gl/schema-utils';

/** Bounds in longitude and latitude degrees, ordered as west, south, east, north. */
export type TerrainBounds = [number, number, number, number];

type ElevationDecoder = {
  /** Red channel elevation scale. */
  rScaler: number;
  /** Green channel elevation scale. */
  gScaler: number;
  /** Blue channel elevation scale. */
  bScaler: number;
  /** Elevation offset added after channel scaling. */
  offset: number;
};

/** Options for fixed grid terrain mesh generation. */
export type GridTerrainOptions = {
  /** Terrain image bounds in longitude and latitude degrees. */
  bounds: TerrainBounds;
  /** Decoder used to convert terrain image channels to elevation values. */
  elevationDecoder: ElevationDecoder;
  /** Vertices per side. 33 produces 1089 vertices and 2048 triangles per tile. */
  gridSize?: number;
  /** Meters to lower edge vertices to hide gaps between adjacent tiles. */
  skirtHeight?: number;
};

type TerrainImage = {
  /** Terrain image pixel data. */
  data: Uint8Array | Uint8ClampedArray;
  /** Terrain image width in pixels. */
  width: number;
  /** Terrain image height in pixels. */
  height: number;
};

type BoundingBox = [[number, number, number], [number, number, number]];

const MAX_LATITUDE = 85.051129;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Convert latitude in degrees to normalized Mercator y. */
function getMercatorYFromLatitude(latitude: number): number {
  const clampedLatitude = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));
  const sine = Math.sin(clampedLatitude * DEG2RAD);
  return 0.5 * Math.log((1 + sine) / (1 - sine));
}

/** Convert normalized Mercator y to latitude in degrees. */
function getLatitudeFromMercatorY(mercatorY: number): number {
  return (2 * Math.atan(Math.exp(mercatorY)) - Math.PI / 2) * RAD2DEG;
}

/** Sample a height-map image using bilinear interpolation. */
function sampleElevationBilinear(
  image: TerrainImage,
  horizontalRatio: number,
  verticalRatio: number,
  decoder: ElevationDecoder
): number {
  const {data, width, height} = image;
  const horizontalPixel = horizontalRatio * (width - 1);
  const verticalPixel = verticalRatio * (height - 1);
  const westPixel = Math.floor(horizontalPixel);
  const northPixel = Math.floor(verticalPixel);
  const eastPixel = Math.min(westPixel + 1, width - 1);
  const southPixel = Math.min(northPixel + 1, height - 1);
  const horizontalWeight = horizontalPixel - westPixel;
  const verticalWeight = verticalPixel - northPixel;

  const decode = (columnIndex: number, rowIndex: number): number => {
    const pixelIndex = (rowIndex * width + columnIndex) * 4;
    return (
      decoder.rScaler * data[pixelIndex] +
      decoder.gScaler * data[pixelIndex + 1] +
      decoder.bScaler * data[pixelIndex + 2] +
      decoder.offset
    );
  };

  const northwestElevation = decode(westPixel, northPixel);
  const northeastElevation = decode(eastPixel, northPixel);
  const southwestElevation = decode(westPixel, southPixel);
  const southeastElevation = decode(eastPixel, southPixel);

  const northElevation =
    northwestElevation * (1 - horizontalWeight) + northeastElevation * horizontalWeight;
  const southElevation =
    southwestElevation * (1 - horizontalWeight) + southeastElevation * horizontalWeight;
  return northElevation * (1 - verticalWeight) + southElevation * verticalWeight;
}

/** Validate options before allocating fixed grid mesh buffers. */
function validateGridTerrainOptions(options: GridTerrainOptions): number {
  const {bounds, gridSize = 33} = options;

  if (!bounds || bounds.length !== 4 || bounds.some(value => !Number.isFinite(value))) {
    throw new Error(
      'TerrainLoader: grid tesselator requires bounds as [west, south, east, north] in degrees'
    );
  }

  if (!Number.isInteger(gridSize) || gridSize < 2) {
    throw new Error('TerrainLoader: gridSize must be an integer greater than or equal to 2');
  }

  return gridSize;
}

/** Validate height-map image dimensions before sampling. */
function validateGridTerrainImage(image: TerrainImage): void {
  const {data, width, height} = image;

  if (!data || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error('TerrainLoader: grid tesselator requires a valid terrain image');
  }
}

/**
 * Build raw fixed grid terrain mesh attributes from a height-map image.
 *
 * The grid emits longitude, latitude, and elevation positions directly. Rows
 * are spaced uniformly in Mercator y so image rows map consistently at high
 * latitude and the same mesh can be reused by globe-aware renderers.
 */
export function buildGridMeshAttributes(
  image: TerrainImage,
  options: GridTerrainOptions
): {attributes: MeshAttributes; indices: Uint32Array; boundingBox: BoundingBox} {
  validateGridTerrainImage(image);
  const verticesPerSide = validateGridTerrainOptions(options);
  const {bounds, elevationDecoder, skirtHeight = 0} = options;
  const [west, south, east, north] = bounds;

  const northMercatorY = getMercatorYFromLatitude(north);
  const southMercatorY = getMercatorYFromLatitude(south);

  const vertexCount = verticesPerSide * verticesPerSide;
  const positions = new Float32Array(vertexCount * 3);
  const texCoords = new Float32Array(vertexCount * 2);

  let minimumElevation = Infinity;
  let maximumElevation = -Infinity;

  for (let rowIndex = 0; rowIndex < verticesPerSide; rowIndex++) {
    const verticalRatio = rowIndex / (verticesPerSide - 1);
    const mercatorY = northMercatorY + verticalRatio * (southMercatorY - northMercatorY);
    const latitude = getLatitudeFromMercatorY(mercatorY);

    for (let columnIndex = 0; columnIndex < verticesPerSide; columnIndex++) {
      const horizontalRatio = columnIndex / (verticesPerSide - 1);
      const longitude = west + horizontalRatio * (east - west);

      const sampledElevation = sampleElevationBilinear(
        image,
        horizontalRatio,
        verticalRatio,
        elevationDecoder
      );
      let elevation = sampledElevation;

      minimumElevation = Math.min(minimumElevation, sampledElevation);
      maximumElevation = Math.max(maximumElevation, sampledElevation);

      const onEdge =
        columnIndex === 0 ||
        rowIndex === 0 ||
        columnIndex === verticesPerSide - 1 ||
        rowIndex === verticesPerSide - 1;
      if (onEdge && skirtHeight) {
        elevation -= skirtHeight;
      }

      const positionIndex = (rowIndex * verticesPerSide + columnIndex) * 3;
      positions[positionIndex] = longitude;
      positions[positionIndex + 1] = latitude;
      positions[positionIndex + 2] = elevation;

      const texCoordIndex = (rowIndex * verticesPerSide + columnIndex) * 2;
      texCoords[texCoordIndex] = horizontalRatio;
      texCoords[texCoordIndex + 1] = verticalRatio;
    }
  }

  const quadCount = (verticesPerSide - 1) * (verticesPerSide - 1);
  const indices = new Uint32Array(quadCount * 6);
  let indicesIndex = 0;
  for (let rowIndex = 0; rowIndex < verticesPerSide - 1; rowIndex++) {
    for (let columnIndex = 0; columnIndex < verticesPerSide - 1; columnIndex++) {
      const northwestIndex = rowIndex * verticesPerSide + columnIndex;
      const northeastIndex = rowIndex * verticesPerSide + (columnIndex + 1);
      const southwestIndex = (rowIndex + 1) * verticesPerSide + columnIndex;
      const southeastIndex = (rowIndex + 1) * verticesPerSide + (columnIndex + 1);

      indices[indicesIndex++] = northwestIndex;
      indices[indicesIndex++] = southwestIndex;
      indices[indicesIndex++] = northeastIndex;
      indices[indicesIndex++] = northeastIndex;
      indices[indicesIndex++] = southwestIndex;
      indices[indicesIndex++] = southeastIndex;
    }
  }

  const boundingBox: BoundingBox = [
    [west, south, minimumElevation],
    [east, north, maximumElevation]
  ];

  return {
    attributes: {
      POSITION: {value: positions, size: 3},
      TEXCOORD_0: {value: texCoords, size: 2}
    },
    indices,
    boundingBox
  };
}

/**
 * Build a fixed-resolution grid Mesh from a terrain-RGB heightmap.
 *
 * The returned mesh has triangle-list topology, Uint32 indices, POSITION
 * attributes in longitude, latitude, and elevation, and TEXCOORD_0 attributes
 * aligned to the source height-map image.
 */
export function makeGridTerrainMesh(image: TerrainImage, options: GridTerrainOptions): Mesh {
  const {attributes, indices, boundingBox} = buildGridMeshAttributes(image, options);

  const topology = 'triangle-list';
  const mode = 4; // TRIANGLES
  const schema = deduceMeshSchema(attributes, {
    topology,
    mode: String(mode),
    boundingBox: JSON.stringify(boundingBox)
  });

  return {
    loaderData: {header: {}},
    header: {
      vertexCount: indices.length,
      boundingBox
    },
    schema,
    topology,
    mode,
    indices: {value: indices, size: 1},
    attributes
  };
}
