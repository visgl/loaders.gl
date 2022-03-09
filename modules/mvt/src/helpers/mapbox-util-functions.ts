import Protobuf from 'pbf';
import {MVTMapboxGeometry} from '../lib/types';
import VectorTileFeature from '../lib/mapbox-vector-tile/vector-tile-feature';

/**
 * Classifies an array of rings into polygons with outer rings and holes
 * @param rings
 * @returns polygons
 */
export function classifyRings(rings: MVTMapboxGeometry) {
  const len = rings.length;

  if (len <= 1) return [rings];

  const polygons: number[][][] = [];
  let polygon: number[][] | undefined;
  let ccw: boolean | undefined;

  for (let i = 0; i < len; i++) {
    const area = signedArea(rings[i]);
    if (area === 0) continue; // eslint-disable-line no-continue

    if (ccw === undefined) ccw = area < 0;

    if (ccw === area < 0) {
      if (polygon) polygons.push(polygon);
      polygon = [rings[i]];
    } else if (polygon) polygon.push(rings[i]);
  }
  if (polygon) polygons.push(polygon);

  return polygons;
}

/**
 *
 * @param ring
 * @returns sum
 */
export function signedArea(ring: number[][]) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1, p1: number[], p2: number[]; i < ring.length; j = i++) {
    p1 = ring[i];
    p2 = ring[j];
    sum += (p2[0] - p1[0]) * (p1[1] + p2[1]);
  }
  return sum;
}

/**
 *
 * @param tag
 * @param feature
 * @param pbf
 */
export function readFeature(tag: number, feature?: VectorTileFeature, pbf?: Protobuf): void {
  if (feature && pbf) {
    if (tag === 1) feature.id = pbf.readVarint();
    else if (tag === 2) readTag(pbf, feature);
    else if (tag === 3) feature.type = pbf.readVarint();
    else if (tag === 4) feature._geometry = pbf.pos;
  }
}

/**
 *
 * @param pbf
 * @param feature
 */
export function readTag(pbf: Protobuf, feature: VectorTileFeature): void {
  const end = pbf.readVarint() + pbf.pos;

  while (pbf.pos < end) {
    const key = feature._keys[pbf.readVarint()];
    const value = feature._values[pbf.readVarint()];
    feature.properties[key] = value;
  }
}
