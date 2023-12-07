// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
import {Schema} from '@loaders.gl/schema';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {convertParquetSchema} from '../arrow/convert-schema-from-parquet';
import {unpackGeoMetadata, unpackJSONStringMetadata} from '@loaders.gl/gis';

export async function getSchemaFromParquetReader(reader: ParquetReader): Promise<Schema> {
  const parquetSchema = await reader.getSchema();
  const parquetMetadata = await reader.getFileMetadata();
  const schema = convertParquetSchema(parquetSchema, parquetMetadata);
  unpackGeoMetadata(schema);
  unpackJSONStringMetadata(schema, 'pandas');
  return schema;
}
