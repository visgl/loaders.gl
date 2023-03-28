// loaders.gl, MIT license
import {Schema, Field} from '@loaders.gl/schema';

/** geoarrow / parquet schema is stringified into a single key-value pair in the parquet metadata */
export function decodeGeoMetadata(schema: Schema): void {
  const geoparquetStringifiedMetadata = schema.metadata.get('geo');
  if (!geoparquetStringifiedMetadata) {
    return;
  }

  try {
    const geoparquetJSON = JSON.parse(geoparquetStringifiedMetadata);

    // Store Parquet Schema Level Metadata

    const {version, primary_column, columns} = geoparquetJSON;
    if (version) {
      schema.metadata.set('geo.version', version);
    }

    if (primary_column) {
      schema.metadata.set('geo.primary_column', primary_column);
    }

    // store column names as comma separated list
    schema.metadata.set('geo.columns', Object.keys(columns || {}).join(''));
 
    for (const [columnName, columnMetadata] of Object.entries(columns || {})) {
      const field = schema.fields.find((field) => field.name === columnName);
      if (field) {
        if (field.name === primary_column) {
          field.metadata.set('geo.primary_field', 'true');
        }
        decodeGeoFieldMetadata(field, columnMetadata);
      }
    }
  } catch {
    // ignore
  }
}

function decodeGeoFieldMetadata(field: Field, columnMetadata): void {
  for (const [key, value] of Object.entries(columnMetadata || {})) {
    switch (key) {
      case 'geometry_type':
        field.metadata.set(`geo.${key}`, (value as string[]).join(','));
        break;
      case 'bbox':
      case 'crs':
      case 'edges':
      default:
        field.metadata.set(
          `geo.${key}`,
          typeof value === 'string' ? value : JSON.stringify(value)
        );
    }
  }
}
