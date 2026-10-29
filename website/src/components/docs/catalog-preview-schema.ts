import {Schema} from 'apache-arrow';

/** Separates metadata from the field table without mutating the source schema. */
export function getCatalogPreviewSchema(schema: Schema): Schema {
  return new Schema(
    schema.fields.map(field => field.clone({metadata: new Map()})),
    new Map(),
    schema.dictionaries,
    schema.metadataVersion
  );
}

/** Decodes JSON-valued metadata for a tree, omitting the redundant serialized Arrow schema. */
export function getCatalogPreviewMetadata(
  metadata: ReadonlyMap<string, string>
): Record<string, unknown> {
  return Object.fromEntries(
    [...metadata]
      .filter(([name]) => name !== 'ARROW:schema')
      .map(([name, value]) => {
        try {
          return [name, JSON.parse(value)];
        } catch {
          return [name, value];
        }
      })
  );
}
