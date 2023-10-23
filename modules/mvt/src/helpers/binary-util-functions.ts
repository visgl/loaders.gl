import Protobuf from 'pbf';
import {getPolygonSignedArea} from '@math.gl/polygon';
import {FlatIndexedGeometry, FlatPolygon} from '@loaders.gl/schema';
import VectorTileFeature from '../lib/binary-vector-tile/vector-tile-feature';

/**
 * Classifies an array of rings into polygons with outer rings and holes
 * The function also detects holes which have zero area and
 * removes them. In doing so it modifies the input
 * `geom.data` array to remove the unneeded data
 *
 * @param geometry
 * @returns object
 */
// eslint-disable-next-line max-statements
export function classifyRings(geom: FlatIndexedGeometry): FlatPolygon {
  const len = geom.indices.length;
  const type = 'Polygon';

  if (len <= 1) {
    return {
      type,
      data: geom.data,
      areas: [[getPolygonSignedArea(geom.data)]],
      indices: [geom.indices]
    };
  }

  const areas: any[] = [];
  const polygons: any[] = [];
  let ringAreas: number[] = [];
  let polygon: number[] = [];
  let ccw: boolean | undefined;
  let offset = 0;

  for (let endIndex: number, i = 0, startIndex: number; i < len; i++) {
    startIndex = geom.indices[i] - offset;

    endIndex = geom.indices[i + 1] - offset || geom.data.length;
    const shape = geom.data.slice(startIndex, endIndex);
    const area = getPolygonSignedArea(shape);

    if (area === 0) {
      // This polygon has no area, so remove it from the shape
      // Remove the section from the data array
      const before = geom.data.slice(0, startIndex);
      const after = geom.data.slice(endIndex);
      geom.data = before.concat(after);

      // Need to offset any remaining indices as we have
      // modified the data buffer
      offset += endIndex - startIndex;

      // Do not add this index to the output and process next shape
      continue; // eslint-disable-line no-continue
    }

    if (ccw === undefined) ccw = area < 0;

    if (ccw === area < 0) {
      if (polygon.length) {
        areas.push(ringAreas);
        polygons.push(polygon);
      }
      polygon = [startIndex];
      ringAreas = [area];
    } else {
      ringAreas.push(area);
      polygon.push(startIndex);
    }
  }
  if (ringAreas) areas.push(ringAreas);
  if (polygon.length) polygons.push(polygon);

  return {type, areas, indices: polygons, data: geom.data};
}

/**
 *
 * @param data
 * @param x0
 * @param y0
 * @param size
 */
export function project(data: number[], x0: number, y0: number, size: number): void {
  for (let j = 0, jl = data.length; j < jl; j += 2) {
    data[j] = ((data[j] + x0) * 360) / size - 180;
    const y2 = 180 - ((data[j + 1] + y0) * 360) / size;
    data[j + 1] = (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
  }
}

/**
 * All code below is unchanged from the original Mapbox implemenation
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
