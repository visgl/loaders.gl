// import {deserialize} from 'flatgeobuf/lib/geojson/featurecollection';
import {deserialize, deserializeStream} from 'flatgeobuf/dist/flatgeobuf-geojson.min';

/*
 * Parse FlatGeobuf arrayBuffer and return GeoJSON.
 *
 * @param {arrayBuffer} _ A FlatGeobuf arrayBuffer
 * @return {?Object} A GeoJSON geometry object
 */
export default function parseFlatGeobuf(input, options) {
  if (input.byteLength === 0) {
    return [];
  }

  const arr = new Uint8Array(input);
  const {features} = deserialize(arr);
  return features;
}

/*
 * Parse FlatGeobuf arrayBuffer and return GeoJSON.
 *
 * @param {ReadableStream} _ A FlatGeobuf arrayBuffer
 * @return  A GeoJSON geometry object iterator
 */
export function parseFlatGeobufInBatches(stream, options) {
  const iterator = deserializeStream(stream);
  return iterator;
}
