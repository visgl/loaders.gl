// import {deserialize} from 'flatgeobuf/lib/geojson/featurecollection';
import {deserialize, deserializeStream} from 'flatgeobuf/dist/flatgeobuf-geojson.min';
function binaryFromFeature(feature, header) {
  var geometry = feature.geometry();

  // FlatGeobuf files can only hold a single geometry type per file, otherwise
  // GeometryType is GeometryCollection
  // I believe geometry.type() is null (0) except when the geometry type isn't
  // known in the header?
  var geometryType = header.geometryType || geometry.type();
  var parsedGeometry = binaryFromGeometry(geometry, geometryType);
  parsedGeometry.properties = parseProperties(feature, header.columns);

  // TODO: wrap binary data either in points, lines, or polygons key
  return parsedGeometry;
}

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
