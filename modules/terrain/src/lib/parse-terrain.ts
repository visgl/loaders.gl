import {getMeshBoundingBox} from '@loaders.gl/schema';
import Martini from '@mapbox/martini';
import Delatin from './delatin';
import {addSkirt} from './helpers/skirt';

type TerrainOptions = {
  meshMaxError: number;
  bounds: number[];
  elevationDecoder: ElevationDecoder;
  tesselator: 'martini' | 'delatin';
  skirtHeight?: number;
};

type TerrainImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

type ElevationDecoder = {
  rScaler: any;
  bScaler: any;
  gScaler: any;
  offset: number;
};

function getTerrain(
  imageData: Uint8Array,
  width: number,
  height: number,
  elevationDecoder: ElevationDecoder,
  tesselator: 'martini' | 'delatin'
) {
  const {rScaler, bScaler, gScaler, offset} = elevationDecoder;

  // From Martini demo
  // https://observablehq.com/@mourner/martin-real-time-rtin-terrain-mesh
  const terrain = new Float32Array((width + 1) * (height + 1));
  // decode terrain values
  for (let i = 0, y = 0; y < height; y++) {
    for (let x = 0; x < width; x++, i++) {
      const k = i * 4;
      const r = imageData[k + 0];
      const g = imageData[k + 1];
      const b = imageData[k + 2];
      terrain[i + y] = r * rScaler + g * gScaler + b * bScaler + offset;
    }
  }

  if (tesselator === 'martini') {
    // backfill bottom border
    for (let i = (width + 1) * width, x = 0; x < width; x++, i++) {
      terrain[i] = terrain[i - width - 1];
    }
    // backfill right border
    for (let i = height, y = 0; y < height + 1; y++, i += height + 1) {
      terrain[i] = terrain[i - 1];
    }
  }

  return terrain;
}

function getMeshAttributes(
  vertices,
  terrain: Uint8Array,
  width: number,
  height: number,
  bounds: number[]
) {
  const gridSize = width + 1;
  const numOfVerticies = vertices.length / 2;
  // vec3. x, y in pixels, z in meters
  const positions = new Float32Array(numOfVerticies * 3);
  // vec2. 1 to 1 relationship with position. represents the uv on the texture image. 0,0 to 1,1.
  const texCoords = new Float32Array(numOfVerticies * 2);

  const [minX, minY, maxX, maxY] = bounds || [0, 0, width, height];
  const xScale = (maxX - minX) / width;
  const yScale = (maxY - minY) / height;

  for (let i = 0; i < numOfVerticies; i++) {
    const x = vertices[i * 2];
    const y = vertices[i * 2 + 1];
    const pixelIdx = y * gridSize + x;

    positions[3 * i + 0] = x * xScale + minX;
    positions[3 * i + 1] = -y * yScale + maxY;
    positions[3 * i + 2] = terrain[pixelIdx];

    texCoords[2 * i + 0] = x / width;
    texCoords[2 * i + 1] = y / height;
  }

  return {
    POSITION: {value: positions, size: 3},
    TEXCOORD_0: {value: texCoords, size: 2}
    // NORMAL: {}, - optional, but creates the high poly look with lighting
  };
}

/**
 * Returns generated mesh object from image data
 *
 * @param {object} terrainImage terrain image data
 * @param {object} terrainOptions terrain options
 * @returns mesh object
 */
function getMesh(terrainImage: TerrainImage, terrainOptions: TerrainOptions) {
  if (terrainImage === null) {
    return null;
  }
  const {meshMaxError, bounds, elevationDecoder} = terrainOptions;

  const {data, width, height} = terrainImage;

  let terrain;
  let mesh;
  switch (terrainOptions.tesselator) {
    case 'martini':
      terrain = getTerrain(data, width, height, elevationDecoder, terrainOptions.tesselator);
      mesh = getMartiniTileMesh(meshMaxError, width, terrain);
      break;
    case 'delatin':
      terrain = getTerrain(data, width, height, elevationDecoder, terrainOptions.tesselator);
      mesh = getDelatinTileMesh(meshMaxError, width, height, terrain);
      break;
    // auto
    default:
      if (width === height && !(height & (width - 1))) {
        terrain = getTerrain(data, width, height, elevationDecoder, 'martini');
        mesh = getMartiniTileMesh(meshMaxError, width, terrain);
      } else {
        terrain = getTerrain(data, width, height, elevationDecoder, 'delatin');
        mesh = getDelatinTileMesh(meshMaxError, width, height, terrain);
      }
      break;
  }

  const {vertices} = mesh;
  let {triangles} = mesh;
  let attributes = getMeshAttributes(vertices, terrain, width, height, bounds);

  // Compute bounding box before adding skirt so that z values are not skewed
  const boundingBox = getMeshBoundingBox(attributes);

  if (terrainOptions.skirtHeight) {
    const {attributes: newAttributes, triangles: newTriangles} = addSkirt(
      attributes,
      triangles,
      terrainOptions.skirtHeight
    );
    attributes = newAttributes;
    triangles = newTriangles;
  }

  return {
    // Data return by this loader implementation
    loaderData: {
      header: {}
    },
    header: {
      vertexCount: triangles.length,
      boundingBox
    },
    mode: 4, // TRIANGLES
    indices: {value: Uint32Array.from(triangles), size: 1},
    attributes
  };
}

/**
 * Get Martini generated vertices and triangles
 *
 * @param {number} meshMaxError threshold for simplifying mesh
 * @param {number} width width of the input data
 * @param {number[] | Float32Array} terrain elevation data
 * @returns {{vertices: Uint16Array, triangles: Uint32Array}} vertices and triangles data
 */
function getMartiniTileMesh(meshMaxError, width, terrain) {
  const gridSize = width + 1;
  const martini = new Martini(gridSize);
  const tile = martini.createTile(terrain);
  const {vertices, triangles} = tile.getMesh(meshMaxError);

  return {vertices, triangles};
}

/**
 * Get Delatin generated vertices and triangles
 *
 * @param {number} meshMaxError threshold for simplifying mesh
 * @param {number} width width of the input data array
 * @param {number} height height of the input data array
 * @param {number[] | Float32Array} terrain elevation data
 * @returns {{vertices: number[], triangles: number[]}} vertices and triangles data
 */
function getDelatinTileMesh(meshMaxError, width, height, terrain) {
  const tin = new Delatin(terrain, width + 1, height + 1);
  tin.run(meshMaxError);
  // @ts-expect-error
  const {coords, triangles} = tin;
  const vertices = coords;
  return {vertices, triangles};
}

export default async function loadTerrain(arrayBuffer, options, context) {
  const loadImageOptions = {
    ...options,
    mimeType: 'application/x.image',
    image: {...options.image, type: 'data'}
  };
  const image = await context.parse(arrayBuffer, loadImageOptions);
  // Extend function to support additional mesh generation options (square grid or delatin)
  return getMesh(image, options.terrain);
}
