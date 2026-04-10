// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
import {Schema} from '@loaders.gl/schema';
import {unpackGeoMetadata, unpackJSONStringMetadata} from '@loaders.gl/geoarrow';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {convertParquetSchema} from '../arrow/convert-schema-from-parquet';

export async function getSchemaFromParquetReader(reader: ParquetReader): Promise<Schema> {
  const parquetSchema = await reader.getSchema();
  const parquetMetadata = await reader.getFileMetadata();
  const schema = convertParquetSchema(parquetSchema, parquetMetadata);
  unpackGeoMetadata(schema.metadata);
  unpackJSONStringMetadata(schema.metadata, 'pandas');
  return schema;
}
