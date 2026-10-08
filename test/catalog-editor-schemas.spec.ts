import {describe, expect, test} from 'vitest';
import {
  earthGeoidManifestSchema,
  getCatalogEditorSchema
} from '../website/src/components/docs/catalog-editor-schemas';

describe('catalog editor schemas', () => {
  test.each(['1.0.0', '1.1.0'])('bundles self-contained official STAC %s references', version => {
    for (const type of ['Catalog', 'Collection', 'Feature']) {
      const selected = getCatalogEditorSchema(
        {type, stac_version: version},
        'https://example.org/catalog.json'
      );
      expect(selected?.title).toContain(version);
      const schema = selected!.jsonSchema;
      const references = JSON.stringify(schema).matchAll(/"\$ref":"([^"]+)"/g);
      const definitions = schema.definitions as Record<
        string,
        {properties?: Record<string, unknown>}
      >;
      const metaSchema = Object.values(definitions).find(
        definition => definition.properties?.$schema
      );
      expect(metaSchema?.properties?.$id).toEqual({type: 'string', format: 'uri-reference'});
      expect(metaSchema?.properties?.$ref).toEqual({type: 'string', format: 'uri-reference'});

      for (const [, reference] of references) {
        expect(reference.startsWith('#/')).toBe(true);
        let target: unknown = schema;
        for (const key of reference.slice(2).split('/')) {
          target = (target as Record<string, unknown>)[
            decodeURIComponent(key).replace(/~1/g, '/').replace(/~0/g, '~')
          ];
        }
        expect(target).toBeDefined();
      }
    }
  });
  test('validates geoid dimensions and hashes while allowing extensions', () => {
    const manifest = {
      model: 'EGM96',
      source: 'https://example.org/data',
      sourceSha256: 'a'.repeat(64),
      license: 'Public domain',
      extension: true,
      files: {
        'geoid.pgm': {
          width: 360,
          height: 181,
          spacingArcMinutes: 60,
          bytes: 100,
          sha256: 'b'.repeat(64)
        }
      }
    };
    expect(earthGeoidManifestSchema.safeParse(manifest).success).toBe(true);
    expect(earthGeoidManifestSchema.safeParse({...manifest, sourceSha256: 'invalid'}).success).toBe(
      false
    );
    expect(
      earthGeoidManifestSchema.safeParse({
        ...manifest,
        files: {'geoid.pgm': {...manifest.files['geoid.pgm'], width: 0}}
      }).success
    ).toBe(false);
  });
  test('selects recognizable invalid manifests so the editor can diagnose them', () => {
    expect(
      getCatalogEditorSchema(
        {model: 'EGM96', sourceSha256: 'invalid'},
        'https://example.org/manifest.json'
      )?.title
    ).toBe('Earth geoid manifest');
    expect(
      getCatalogEditorSchema(
        {},
        'https://example.org/earth/glaciations/v1/alpine/preview-manifest.json'
      )?.title
    ).toBe('Earth glaciation preview');
    expect(
      getCatalogEditorSchema({unrelated: true}, 'https://example.org/data.json')
    ).toBeUndefined();
    expect(
      getCatalogEditorSchema(
        {type: 'Catalog', stac_version: '9.0.0'},
        'https://example.org/catalog.json'
      )
    ).toBeUndefined();
  });
  test('does not apply manifest schemas to ordinary Earth JSON assets', () => {
    expect(
      getCatalogEditorSchema(
        {temperature: [1, 2]},
        'https://example.org/earth/glaciations/v1/koehler2015/climate.json'
      )
    ).toBeUndefined();
  });
  test('validates the EGM2008 dataset manifest layout', () => {
    const manifest = {
      id: 'egm2008',
      title: 'EGM2008',
      credit: 'NGA',
      dataset: 'https://example.org/data',
      license: 'other',
      licenseUrl: 'https://example.org/license',
      sourceSha256: 'a'.repeat(64),
      rows: 6,
      bbox: [-180, -90, 180, 90],
      grid: {
        model: 'EGM2008',
        width: 3,
        height: 2,
        spacingArcMinutes: 5,
        offset: -108,
        scale: 0.003,
        sourcePgmSha256: 'b'.repeat(64)
      },
      files: [{path: 'grid.parquet', bytes: 100, sha256: 'c'.repeat(64)}]
    };
    expect(earthGeoidManifestSchema.safeParse(manifest).success).toBe(true);
    expect(
      earthGeoidManifestSchema.safeParse({...manifest, grid: {...manifest.grid, scale: 0}}).success
    ).toBe(false);
  });
});
