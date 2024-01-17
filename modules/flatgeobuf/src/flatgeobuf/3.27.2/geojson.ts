import {
  deserialize as fcDeserialize,
  deserializeStream as fcDeserializeStream,
  deserializeFiltered as fcDeserializeFiltered,
  serialize as fcSerialize
} from './geojson/featurecollection';

import {FeatureCollection as GeoJsonFeatureCollection} from 'geojson';

import {Rect} from './packedrtree';
import {IGeoJsonFeature} from './geojson/feature';
import {HeaderMetaFn} from './generic';

/**
 * Serialize GeoJSON to FlatGeobuf
 * @param geojson GeoJSON object to serialize
 */
export function serialize(geojson: GeoJsonFeatureCollection): Uint8Array {
  const bytes = fcSerialize(geojson);
  return bytes;
}

/**
 * Deserialize FlatGeobuf into GeoJSON
 * @param input Input byte array, stream or string
 * @param rect Filter rectangle
 * @param headerMetaFn Callback that will recieve header metadata when available
 */
export function deserialize(
  input: Uint8Array | ReadableStream | string,
  rect?: Rect,
  headerMetaFn?: HeaderMetaFn
): GeoJsonFeatureCollection | AsyncGenerator<IGeoJsonFeature> {
  if (input instanceof Uint8Array) return fcDeserialize(input, headerMetaFn);
  else if (input instanceof ReadableStream) return fcDeserializeStream(input, headerMetaFn);
  return fcDeserializeFiltered(input, rect as Rect, headerMetaFn);
}
