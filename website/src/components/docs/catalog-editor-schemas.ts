import {z} from 'zod';
import stacVersion100SchemaBundle from './schemas/stac-1.0.0.json';
import stacVersion110SchemaBundle from './schemas/stac-1.1.0.json';

const sha256Schema = z
  .string()
  .regex(/^[a-fA-F0-9]{64}$/)
  .describe('SHA-256 digest of the source or asset.');
const countSchema = z.number().int().nonnegative();
const dimensionSchema = z.number().int().positive();
const assetFileSchema = z.looseObject({
  path: z.string().min(1).describe('Asset path relative to this manifest.'),
  bytes: countSchema.describe('Encoded file size in bytes.'),
  sha256: sha256Schema,
  rows: countSchema.optional(),
  rowGroups: countSchema.optional()
});
const datasetManifestFields = {
  id: z.string().min(1),
  credit: z.string(),
  datasetURL: z.url(),
  license: z.string(),
  licenseUrl: z.url(),
  files: z.array(assetFileSchema).min(1)
};

/** Earth geoid manifest, including raster dimensions and source checksums. */
export const earthGeoidRasterManifestSchema = z.looseObject({
  model: z.string().min(1),
  source: z.url(),
  sourceSha256: sha256Schema,
  license: z.string(),
  files: z.record(
    z.string(),
    z.looseObject({
      width: dimensionSchema,
      height: dimensionSchema,
      spacingArcMinutes: z.number().positive(),
      bytes: countSchema,
      sha256: sha256Schema,
      rows: countSchema.optional(),
      offset: z.number().optional(),
      scale: z.number().positive().optional(),
      pgmSha256: sha256Schema.optional(),
      format: z.string().optional()
    })
  )
});

/** Earth geoid dataset manifest with grid metadata and an array of assets. */
export const earthGeoidDatasetManifestSchema = z.looseObject({
  id: z.string(), title: z.string(), credit: z.string(), dataset: z.url(),
  license: z.string(), licenseUrl: z.url(), sourceSha256: sha256Schema,
  rows: countSchema, bbox: z.array(z.number()).length(4),
  grid: z.looseObject({
    model: z.string(), width: dimensionSchema, height: dimensionSchema,
    spacingArcMinutes: z.number().positive(), offset: z.number(), scale: z.number().positive(),
    sourcePgmSha256: sha256Schema
  }),
  files: z.array(assetFileSchema).min(1)
});

/** Supported Earth geoid manifest layouts, including EGM96 and EGM2008. */
export const earthGeoidManifestSchema = z.union([earthGeoidRasterManifestSchema, earthGeoidDatasetManifestSchema]);

/** Earth glaciation dataset manifest describing age slices and encoded assets. */
export const earthGlaciationManifestSchema = z.looseObject({
  ...datasetManifestFields,
  ageUnit: z.string(),
  ages: z.array(z.number()).min(1),
  columns: z.array(z.string()).optional(),
  rows: countSchema.optional(),
  dimensions: z
    .looseObject({time: dimensionSchema, lat: dimensionSchema, lon: dimensionSchema})
    .optional(),
  rowGroupIndex: z
    .array(z.looseObject({rowGroup: countSchema, ageKa: z.number(), rows: countSchema}))
    .optional()
});

/** Earth glaciation image preview manifest and its source provenance. */
export const earthGlaciationPreviewSchema = z.looseObject({
  width: dimensionSchema,
  height: dimensionSchema,
  ages: z.array(z.number()).min(1),
  areaKm2: z.array(z.number().nonnegative()),
  volumeKm3: z.array(z.number().nonnegative()),
  assetSha256: sha256Schema,
  source: z.looseObject({url: z.url(), sha256: sha256Schema, license: z.string()}),
  spacingKm: z.number().positive().optional(),
  spacingDegrees: z.number().positive().optional()
});

/** Earth spatial dataset manifest with GeoParquet geometry metadata. */
export const earthSpatialManifestSchema = z.looseObject({
  ...datasetManifestFields,
  title: z.string(),
  sourceRepositoryCommit: z.string().regex(/^[a-fA-F0-9]{40}$/),
  sourcePath: z.string(),
  sourceSha256: sha256Schema,
  rows: countSchema,
  columns: z.array(z.string()),
  bbox: z.array(z.number()).length(4),
  geometry: z.looseObject({
    version: z.string(),
    primary_column: z.string(),
    columns: z.record(
      z.string(),
      z.looseObject({encoding: z.string(), geometry_types: z.array(z.string())})
    )
  })
});

/** Earth tectonic rotation manifest with plate and age metadata. */
export const earthTectonicManifestSchema = z.looseObject({
  model: z.string(),
  version: z.string(),
  datasetURL: z.url(),
  license: z.string(),
  licenseUrl: z.url(),
  archiveSHA256: sha256Schema,
  sourceFilesSHA256: z.record(z.string(), sha256Schema),
  anchorPlateId: countSchema,
  ages: z.looseObject({
    unit: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number().positive()
  }),
  polygonRows: countSchema,
  plateCount: countSchema,
  files: z.array(assetFileSchema).min(1)
});

/** Selects an editor schema by document discriminator or recognized Earth manifest URL. */
export function getCatalogEditorSchema(
  document: unknown,
  url: string
): {title: string; jsonSchema: Record<string, unknown>} | undefined {
  if (!document || typeof document !== 'object' || Array.isArray(document)) return undefined;
  const documentProperties = document as Record<string, unknown>;
  const documentType =
    documentProperties.type === 'Catalog'
      ? 'catalog'
      : documentProperties.type === 'Collection'
        ? 'collection'
        : documentProperties.type === 'Feature'
          ? 'item'
          : undefined;
  if (
    documentType &&
    (documentProperties.stac_version === '1.0.0' || documentProperties.stac_version === '1.1.0')
  ) {
    const bundle =
      documentProperties.stac_version === '1.0.0'
        ? stacVersion100SchemaBundle
        : stacVersion110SchemaBundle;
    return {
      title: `STAC ${documentProperties.type} ${documentProperties.stac_version}`,
      jsonSchema: {
        $schema: bundle.$schema,
        $ref: bundle.roots[documentType],
        definitions: bundle.definitions
      }
    };
  }
  let schema: z.ZodType | undefined;
  let title = '';
  if (
    /\/geoid\//.test(url) ||
    ('model' in documentProperties && 'sourceSha256' in documentProperties)
  ) {
    schema = earthGeoidManifestSchema;
    title = 'Earth geoid manifest';
  } else if (
    /preview-manifest\.json/.test(url) ||
    ('assetSha256' in documentProperties && 'ages' in documentProperties)
  ) {
    schema = earthGlaciationPreviewSchema;
    title = 'Earth glaciation preview';
  } else if (
    /\/glaciations\//.test(url) ||
    ('ageUnit' in documentProperties && 'files' in documentProperties)
  ) {
    schema = earthGlaciationManifestSchema;
    title = 'Earth glaciation manifest';
  } else if (
    /\/(boundaries|hydrography)\//.test(url) ||
    ('sourceRepositoryCommit' in documentProperties && 'geometry' in documentProperties)
  ) {
    schema = earthSpatialManifestSchema;
    title = 'Earth spatial manifest';
  } else if (/\/tectonic-movements\//.test(url) || 'archiveSHA256' in documentProperties) {
    schema = earthTectonicManifestSchema;
    title = 'Earth tectonic manifest';
  }
  return schema ? {title, jsonSchema: z.toJSONSchema(schema, {target: 'draft-7'})} : undefined;
}
