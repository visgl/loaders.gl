// loaders.gl, MIT license
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

// import type {Feature} from '@loaders.gl/schema';

export type GeoJSONTileFeature = {
  type: any;
  geometry: any;

  // book keeping
  id?: string;
  tags?: string[];

  // spatial extents
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type GeoJSONTile = {
  features: GeoJSONTileFeature[]; // Feature[]; Doesn't seem JSON compatible??
  type?: number;
  tags?: Record<string, string>;

  // tile coordinates
  x: number;
  y: number;
  z: number;

  // spatial extents
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;

  transformed: boolean;
  numPoints: number;
  numSimplified: number;
  numFeatures: number;
  source: any | null;
};

export type CreateTileOptions = {
  maxZoom?: number;
  tolerance: number;
  extent: number;
  lineMetrics: boolean;
};

/**
 * Create a tile from features and tile index
 */
export function createTile(features: any[], z, tx, ty, options: CreateTileOptions): GeoJSONTile {
  const tolerance = z === options.maxZoom ? 0 : options.tolerance / ((1 << z) * options.extent);
  const tile: GeoJSONTile = {
    features: [],
    numPoints: 0,
    numSimplified: 0,
    numFeatures: features.length,
    source: null,
    x: tx,
    y: ty,
    z,
    transformed: false,
    minX: 2,
    minY: 1,
    maxX: -1,
    maxY: 0
  };
  for (const feature of features) {
    addFeature(tile, feature, tolerance, options);
  }
  return tile;
}

// eslint-disable-next-line complexity, max-statements
function addFeature(tile: GeoJSONTile, feature, tolerance: number, options: CreateTileOptions) {
  const geom = feature.geometry;
  const type = feature.type;
  const simplified: number[] = [];

  tile.minX = Math.min(tile.minX, feature.minX);
  tile.minY = Math.min(tile.minY, feature.minY);
  tile.maxX = Math.max(tile.maxX, feature.maxX);
  tile.maxY = Math.max(tile.maxY, feature.maxY);

  if (type === 'Point' || type === 'MultiPoint') {
    for (let i = 0; i < geom.length; i += 3) {
      simplified.push(geom[i], geom[i + 1]);
      tile.numPoints++;
      tile.numSimplified++;
    }
  } else if (type === 'LineString') {
    addLine(simplified, geom, tile, tolerance, false, false);
  } else if (type === 'MultiLineString' || type === 'Polygon') {
    for (let i = 0; i < geom.length; i++) {
      addLine(simplified, geom[i], tile, tolerance, type === 'Polygon', i === 0);
    }
  } else if (type === 'MultiPolygon') {
    for (let k = 0; k < geom.length; k++) {
      const polygon = geom[k];
      for (let i = 0; i < polygon.length; i++) {
        addLine(simplified, polygon[i], tile, tolerance, true, i === 0);
      }
    }
  }

  if (simplified.length) {
    let tags = feature.tags || null;

    if (type === 'LineString' && options.lineMetrics) {
      tags = {};
      for (const key in feature.tags) tags[key] = feature.tags[key];
      // eslint-disable-next-line camelcase
      tags.mapbox_clip_start = geom.start / geom.size;
      // eslint-disable-next-line camelcase
      tags.mapbox_clip_end = geom.end / geom.size;
    }

    // @ts-expect-error TODO - create sub type?
    const tileFeature: GeoJSONTileFeature = {
      geometry: simplified,
      type:
        type === 'Polygon' || type === 'MultiPolygon'
          ? 3
          : type === 'LineString' || type === 'MultiLineString'
            ? 2
            : 1,
      tags
    };
    if (feature.id !== null) {
      tileFeature.id = feature.id;
    }
    tile.features.push(tileFeature);
  }
}

// eslint-disable-next-line max-params, max-statements
function addLine(
  result,
  geom,
  tile: GeoJSONTile,
  tolerance: number,
  isPolygon: boolean,
  isOuter: boolean
): void {
  const sqTolerance = tolerance * tolerance;

  if (tolerance > 0 && geom.size < (isPolygon ? sqTolerance : tolerance)) {
    tile.numPoints += geom.length / 3;
    return;
  }

  const ring: number[] = [];

  for (let i = 0; i < geom.length; i += 3) {
    if (tolerance === 0 || geom[i + 2] > sqTolerance) {
      tile.numSimplified++;
      ring.push(geom[i], geom[i + 1]);
    }
    tile.numPoints++;
  }

  if (isPolygon) rewind(ring, isOuter);

  result.push(ring);
}

function rewind(ring: number[], clockwise?: boolean): void {
  let area = 0;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    area += (ring[i] - ring[j]) * (ring[i + 1] + ring[j + 1]);
  }
  if (area > 0 === clockwise) {
    for (let i = 0, len = ring.length; i < len / 2; i += 2) {
      const x = ring[i];
      const y = ring[i + 1];
      ring[i] = ring[len - 2 - i];
      ring[i + 1] = ring[len - 1 - i];
      ring[len - 2 - i] = x;
      ring[len - 1 - i] = y;
    }
  }
}
