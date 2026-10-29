import {expect, test} from 'vitest';
import {Field, Float64, Schema} from 'apache-arrow';
import {
  getCatalogPreviewSchema,
  getCatalogPreviewMetadata
} from '../website/src/components/docs/catalog-preview-schema';

test('separates metadata from decoded fields without changing the source schema', () => {
  const field = new Field('height', new Float64(), true, new Map([['units', 'meters']]));
  const schema = new Schema([field], new Map([['ARROW:schema', 'encoded schema']]));
  const previewSchema = getCatalogPreviewSchema(schema);

  expect(previewSchema.metadata.size).toBe(0);
  expect(previewSchema.fields[0].metadata.size).toBe(0);
  expect(previewSchema.fields[0].name).toBe('height');
  expect(previewSchema.fields[0].type).toBe(field.type);
  expect(previewSchema.fields[0].nullable).toBe(true);
  expect(previewSchema.dictionaries).toBe(schema.dictionaries);
  expect(previewSchema.metadataVersion).toBe(schema.metadataVersion);
  expect(schema.metadata.get('ARROW:schema')).toBe('encoded schema');
  expect(field.metadata.get('units')).toBe('meters');
});

test('decodes nested metadata and omits encoded schema while preserving plain strings', () => {
  const metadata = new Map([
    ['ARROW:schema', 'encoded schema'],
    ['geoid', '{"model":"EGM96","grid":{"width":360}}'],
    ['units', 'meters'],
    ['values', '[1,2]'],
    ['__proto__', '{"safe":true}']
  ]);
  const preview = getCatalogPreviewMetadata(metadata);
  expect(preview).toEqual({
    geoid: {model: 'EGM96', grid: {width: 360}},
    units: 'meters',
    values: [1, 2],
    ['__proto__']: {safe: true}
  });
  expect(Object.getPrototypeOf(preview)).toBe(Object.prototype);
  expect(metadata.size).toBe(5);
});
