// import {deserialize} from 'flatgeobuf/lib/geojson/featurecollection';
import {deserialize} from 'flatgeobuf/dist/flatgeobuf-geojson.min';

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

  const {features} = deserialize(input);
  return features;
}
