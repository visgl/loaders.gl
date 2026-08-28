// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
// import {validateLoader} from 'test/common/conformance';
import { load, loadInBatches, encode, fetchFile, isBrowser, setLoaderOptions } from '@loaders.gl/core';
import type { ArrowTable, ObjectRowTable } from '@loaders.gl/schema';
import { getGeometryColumnsFromSchema } from '@loaders.gl/geoarrow';
import { getGeoMetadata, convertGeometryToWKB } from '@loaders.gl/gis';
import { GeoParquetLoader, ParquetJSWriter, ParquetLoader, ParquetWriter } from '@loaders.gl/parquet';
import { ParquetLoader as BundledParquetLoader, ParquetJSLoader } from '@loaders.gl/parquet/bundled';
import * as arrow from 'apache-arrow';
import { WASM_SUPPORTED_FILES } from './data/files';
const PARQUET_DIR = '@loaders.gl/parquet/test/data';
setLoaderOptions({
    _workerType: 'test'
});
test('ParquetLoader#loader objects', () => {
});
test('ParquetLoader#publishes a module-local worker asset', () => {
    expect(typeof ParquetLoader.worker, 'declares a concrete packaged worker URL').toBe('string');
    expect(String(ParquetLoader.worker).includes('unpkg.com'), 'does not use the implicit worker CDN fallback').toBeFalsy();
    const workerFile = isBrowser ? '/parquet-worker.js' : '/parquet-worker-node.cjs';
    expect(String(ParquetLoader.worker).endsWith(workerFile), 'targets the packaged runtime worker').toBeTruthy();
});
test('ParquetLoader#worker keeps the browser responsive and rehydrates Arrow output', async () => {
    if (!isBrowser) {
        return;
    }
    const response = await fetchFile(`${PARQUET_DIR}/geoparquet/example.parquet`);
    const arrayBuffer = await response.arrayBuffer();
    let mainThreadTicked = false;
    const tablePromise = load(arrayBuffer, ParquetLoader, {
        core: { worker: true, reuseWorkers: false },
        parquet: { shape: 'arrow-table' }
    }) as Promise<ArrowTable>;
    await new Promise<void>(resolve => setTimeout(() => {
        mainThreadTicked = true;
        resolve();
    }, 0));
    const table = await tablePromise;
    expect(mainThreadTicked, 'the main event loop advances while the worker decodes').toBeTruthy();
    expect(table.data instanceof arrow.Table, 'rehydrates an Apache Arrow Table on the main thread').toBeTruthy();
    expect(table.data.getChild('name')?.get(0), 'rehydrated Arrow vectors retain methods').toBe('Fiji');
});
test('ParquetLoader#worker parse is cancellable', async () => {
    if (!isBrowser) {
        return;
    }
    const response = await fetchFile(`${PARQUET_DIR}/geoparquet/example.parquet`);
    const arrayBuffer = await response.arrayBuffer();
    const abortController = new AbortController();
    abortController.abort();
    const tablePromise = load(arrayBuffer, ParquetLoader, {
        core: { worker: true, reuseWorkers: true },
        parquet: { shape: 'arrow-table', signal: abortController.signal }
    });
    let abortError: unknown;
    try {
        await tablePromise;
    }
    catch (error) {
        abortError = error;
    }
    expect((abortError as Error | undefined)?.name, 'terminates the active worker parse').toBe('AbortError');
});
test('ParquetLoader#load Parquet file as arrow-table', async () => {
    const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
    const table = (await load(url, ParquetLoader, {
        parquet: { shape: 'arrow-table' }
    })) as ArrowTable;
    const arrowTable = table.data;
    expect(arrowTable.numRows).toBe(5);
    expect(table.schema?.fields.map((f) => f.name)).toEqual([
        'pop_est',
        'continent',
        'name',
        'iso_a3',
        'gdp_md_est',
        'geometry'
    ]);
});
test('ParquetLoader#load supported files as arrow-table', async () => {
    // t.comment('SUPPORTED FILES');
    for (const { title, path } of WASM_SUPPORTED_FILES) {
        const url = `${PARQUET_DIR}/apache/${path}`;
        const table = (await load(url, ParquetLoader, {
            parquet: { shape: 'arrow-table' }
        })) as ArrowTable;
        const arrowTable = table.data;
        expect(arrowTable instanceof arrow.Table, `GOOD(${title})`).toBeTruthy();
    }
});
test('ParquetLoader#parse applies reader options without passing wasmUrl upstream', async () => {
    const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
    const response = await fetchFile(url);
    const arrayBuffer = await response.arrayBuffer();
    const table = (await BundledParquetLoader.parse(arrayBuffer, {
        parquet: {
            shape: 'arrow-table',
            limit: 2
        }
    })) as ArrowTable;
    expect(table.data.numRows, 'applies limit option').toBe(2);
    expect(table.schema?.fields.map((field) => field.name), 'keeps the file schema').toEqual(['pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry']);
});
test('ParquetJSLoader#arrow-table preserves GeoParquet metadata', async () => {
    const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
    const table = (await load(url, ParquetJSLoader, {
        parquet: {
            shape: 'arrow-table',
            limit: 3
        }
    })) as ArrowTable;
    expect(table.shape).toBe('arrow-table');
    expect(table.data.numRows, 'TypeScript implementation converts selected rows to Arrow').toBe(3);
    expect(getGeometryColumnsFromSchema(table.schema!).geometry?.encoding, 'TypeScript implementation annotates the Arrow geometry field').toBe('geoarrow.wkb');
    expect(getGeoMetadata(table.schema?.metadata)?.columns.geometry.encoding, 'TypeScript implementation preserves GeoParquet schema metadata').toBe('wkb');
    expect(table.data.schema.fields
        .find(field => field.name === 'geometry')
        ?.metadata.get('ARROW:extension:name'), 'TypeScript Arrow schema preserves GeoArrow field metadata').toBe('geoarrow.wkb');
    expect(table.data.schema.metadata.get('geo'), 'TypeScript Arrow schema preserves GeoParquet metadata').toBeTruthy();
    expect(table.data.schema.fields.find(field => field.name === 'pop_est')?.metadata.has('typeLength'), 'TypeScript Arrow schema omits absent physical metadata').toBeFalsy();
    expect(table.data.batches.every(batch => batch.schema === table.data.schema), 'TypeScript Arrow batches reuse the table schema').toBeTruthy();
    expect(table.data.schema.assign(table.data.schema.fields), 'TypeScript Arrow schema restores normal public assignment semantics').not.toBe(table.data.schema);
    expect(table.data.slice(1, 2).numRows, 'TypeScript Arrow table remains sliceable').toBe(1);
});
test('ParquetLoader#load supports arrow-table shape', async () => {
    const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
    const wrapperTable = (await load(url, ParquetLoader, {
        parquet: { shape: 'arrow-table' }
    })) as ArrowTable;
    expect(wrapperTable.shape).toBe('arrow-table');
    expect(wrapperTable.data.numRows).toBe(5);
    expect(wrapperTable.schema?.fields.map(field => field.name)).toEqual(['pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry']);
    expect(getGeometryColumnsFromSchema(wrapperTable.schema!).geometry?.encoding, 'main loader arrow shape annotates geometry field').toBe('geoarrow.wkb');
    expect(getGeoMetadata(wrapperTable.schema?.metadata)?.columns.geometry.encoding, 'main loader arrow shape preserves GeoParquet schema metadata').toBe('wkb');
});
test('ParquetJSLoader#arrow-table supports loadInBatches', async () => {
    const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
    const iterator = await loadInBatches(url, ParquetJSLoader, {
        parquet: {
            shape: 'arrow-table',
            limit: 5,
            batchSize: 2
        }
    });
    let rowCount = 0;
    for await (const batch of iterator) {
        expect(batch.shape).toBe('arrow-table');
        expect(batch.data instanceof arrow.Table, 'returns Apache Arrow table batches').toBeTruthy();
        expect(getGeometryColumnsFromSchema(batch.schema).geometry?.encoding, 'batch loaders.gl schema includes GeoArrow field metadata').toBe('geoarrow.wkb');
        expect(batch.data.schema.fields
            .find(field => field.name === 'geometry')
            ?.metadata.get('ARROW:extension:name'), 'batch Arrow schema includes GeoArrow field metadata').toBe('geoarrow.wkb');
        expect(batch.data.schema.metadata.get('geo'), 'batch Arrow schema preserves GeoParquet metadata').toBeTruthy();
        rowCount += batch.length;
    }
    expect(rowCount, 'returns all requested rows').toBe(5);
});
test('ParquetJSLoader#empty projection batches preserve their row counts', async () => {
    const url = `${PARQUET_DIR}/apache/good/alltypes_plain.parquet`;
    const iterator = await loadInBatches(url, ParquetJSLoader, {
        parquet: {
            shape: 'arrow-table',
            columns: ['missing_column'],
            offset: 2,
            limit: 3,
            batchSize: 2
        }
    });
    const batchLengths: number[] = [];
    for await (const batch of iterator) {
        batchLengths.push(batch.length);
        expect(batch.data.numRows, 'Arrow rows match the advertised batch length').toBe(batch.length);
        expect(batch.data.numCols, 'batch contains no projected columns').toBe(0);
        expect(batch.data.batches.every(recordBatch => recordBatch.schema === batch.data.schema), 'empty projection record batches reuse the containing table schema').toBeTruthy();
    }
    expect(batchLengths, 'preserves requested batching for empty projections').toEqual([2, 1]);
});
test('ParquetWriter#Arrow table round trip', async () => {
    const table = createArrowTable();
    const parquetBuffer = await encode(table, ParquetWriter, {
        worker: false
    });
    const newTable = (await load(parquetBuffer, ParquetLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table' }
    })) as ArrowTable;
    expect(table.data.schema.fields.map(field => [field.name, field.type.typeId, field.type.bitWidth, field.type.isSigned]), 'preserves Arrow field names and physical types').toEqual(newTable.data.schema.fields.map(field => [field.name, field.type.typeId, field.type.bitWidth, field.type.isSigned]));
});
test('ParquetJSLoader#returns object rows through parquetjs adapter', async () => {
    const url = `${PARQUET_DIR}/apache/good/alltypes_plain.parquet`;
    const table = (await load(url, ParquetJSLoader, {
        parquet: {
            limit: 2,
            columns: ['id', 'bool_col']
        }
    })) as ObjectRowTable;
    expect(table.shape).toBe('object-row-table');
    expect(table.data.length).toBe(2);
    expect(Object.keys(table.data[0])).toEqual(['id', 'bool_col']);
});
test('ParquetWriter#encodes plain JS tables through Arrow wasm adapter', async () => {
    const table: ObjectRowTable = {
        shape: 'object-row-table',
        data: [
            { city: 'Paris', count: 2 },
            { city: 'New York', count: 5 }
        ]
    };
    const parquetBuffer = await encode(table, ParquetWriter, {
        worker: false
    });
    const newTable = await load(parquetBuffer, ParquetLoader, {
        core: { worker: false }
    });
    expect(newTable.shape).toBe('object-row-table');
    if (newTable.shape === 'object-row-table') {
        expect(newTable.data).toEqual(table.data);
    }
});
test('ParquetJSWriter#encodes plain JS tables through parquetjs adapter', async () => {
    const table: ObjectRowTable = {
        shape: 'object-row-table',
        data: [
            { city: 'Paris', count: 2 },
            { city: 'New York', count: 5 }
        ]
    };
    const parquetBuffer = await encode(table, ParquetJSWriter, {
        worker: false
    });
    const newTable = await load(parquetBuffer, ParquetJSLoader, {
        core: { worker: false }
    });
    expect(newTable.shape).toBe('object-row-table');
    if (newTable.shape === 'object-row-table') {
        expect(newTable.data).toEqual(table.data);
    }
});
test('ParquetLoader#loadInBatches as arrow-table', async () => {
    const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
    const iterator = await loadInBatches(url, ParquetLoader, {
        parquet: {
            shape: 'arrow-table',
            batchSize: 2,
            limit: 5
        }
    });
    let batchCount = 0;
    let rowCount = 0;
    for await (const batch of iterator) {
        batchCount++;
        rowCount += batch.length;
        expect(batch.data instanceof arrow.Table, 'returns Arrow table batch').toBeTruthy();
        expect(batch.schema.fields.map((field) => field.name), 'batch schema matches file schema').toEqual(['pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry']);
    }
    expect(batchCount > 0, 'returns one or more batches').toBeTruthy();
    expect(rowCount, 'returns all requested rows').toBe(5);
});
test('ParquetLoader#loadInBatches supports arrow-table shape', async () => {
    const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
    const iterator = await loadInBatches(url, ParquetLoader, {
        parquet: {
            shape: 'arrow-table',
            batchSize: 2,
            limit: 5
        }
    });
    let batchCount = 0;
    for await (const batch of iterator) {
        batchCount++;
        expect(batch.shape).toBe('arrow-table');
        expect(getGeometryColumnsFromSchema(batch.schema!).geometry?.encoding, 'batch schema includes GeoArrow field metadata').toBe('geoarrow.wkb');
        expect(getGeoMetadata(batch.schema?.metadata)?.columns.geometry.encoding, 'batch schema preserves GeoParquet metadata').toBe('wkb');
    }
    expect(batchCount > 0, 'returns one or more arrow batches').toBeTruthy();
});
test('ParquetLoader#GeoParquet Arrow output preserves schema and field metadata', async () => {
    const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
    const table = (await load(url, ParquetLoader, {
        parquet: { shape: 'arrow-table' }
    })) as ArrowTable;
    const geometryColumns = getGeometryColumnsFromSchema(table.schema!);
    const geoMetadata = getGeoMetadata(table.schema?.metadata);
    const arrowSchema = table.data.schema;
    expect(geometryColumns.geometry?.encoding, 'geometry field is annotated').toBe('geoarrow.wkb');
    expect(geoMetadata?.columns.geometry, 'schema geo metadata is preserved').toBeTruthy();
    expect(geoMetadata?.columns.geometry.encoding, 'GeoParquet encoding is preserved').toBe('wkb');
    expect(arrowSchema.fields.find(field => field.name === 'geometry')?.metadata.get('ARROW:extension:name'), 'Arrow JS schema contains field metadata').toBe('geoarrow.wkb');
    expect(arrowSchema.metadata.get('geo'), 'Arrow JS schema preserves top-level geo metadata').toBeTruthy();
});
test('GeoParquetLoader#supports arrow-table shape', async () => {
    const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
    const table = await load(url, GeoParquetLoader, {
        parquet: {
            shape: 'arrow-table'
        }
    });
    expect(table.shape, 'returns Arrow output when requested').toBe('arrow-table');
    if (table.shape === 'arrow-table') {
        expect(getGeometryColumnsFromSchema(table.schema!).geometry?.encoding, 'geometry field is annotated for Arrow output').toBe('geoarrow.wkb');
        expect(table.data.schema.fields.find(field => field.name === 'geometry')?.metadata.get('ARROW:extension:name'), 'Arrow schema field metadata is preserved').toBe('geoarrow.wkb');
    }
});
test('ParquetWriter#synthesizes GeoParquet metadata from GeoArrow WKB fields', async () => {
    const table = createGeoArrowWKBTable();
    const parquetBuffer = await encode(table, ParquetWriter, {
        core: { worker: false }
    });
    const newTable = (await load(parquetBuffer, ParquetLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table' }
    })) as ArrowTable;
    const geoMetadata = getGeoMetadata(newTable.schema?.metadata);
    expect(geoMetadata?.primary_column, 'writer synthesizes primary column').toBe('geometry');
    expect(geoMetadata?.columns.geometry.encoding, 'writer synthesizes WKB encoding').toBe('wkb');
    expect(geoMetadata?.columns.geometry.geometry_types, 'writer conservatively infers WKB geometry types').toEqual([]);
    expect(getGeometryColumnsFromSchema(newTable.schema!).geometry?.encoding, 'read path restores GeoArrow field metadata').toBe('geoarrow.wkb');
});
test('ParquetWriter#preserves valid GeoParquet metadata from GeoArrow input', async () => {
    const table = createGeoArrowWKBTable({
        geo: {
            version: '1.1.0',
            primary_column: 'geometry',
            columns: {
                geometry: {
                    encoding: 'wkb',
                    geometry_types: ['Point'],
                    bbox: [0, 0, 1, 1]
                }
            }
        }
    });
    const parquetBuffer = await encode(table, ParquetWriter, {
        core: { worker: false }
    });
    const newTable = (await load(parquetBuffer, ParquetLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table' }
    })) as ArrowTable;
    const geoMetadata = getGeoMetadata(newTable.schema?.metadata);
    expect(geoMetadata?.columns.geometry.bbox, 'writer preserves valid existing GeoParquet metadata').toEqual([0, 0, 1, 1]);
    expect(geoMetadata?.columns.geometry.geometry_types, 'writer keeps valid geometry types').toEqual(['Point']);
});
test('ParquetWriter#replaces invalid GeoParquet metadata from GeoArrow input', async () => {
    const table = createGeoArrowWKBTable({
        geo: {
            version: '1.1.0',
            columns: {}
        }
    });
    const parquetBuffer = await encode(table, ParquetWriter, {
        core: { worker: false }
    });
    const newTable = (await load(parquetBuffer, ParquetLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table' }
    })) as ArrowTable;
    const geoMetadata = getGeoMetadata(newTable.schema?.metadata);
    expect(geoMetadata?.primary_column, 'writer repairs invalid metadata').toBe('geometry');
    expect(geoMetadata?.columns.geometry.encoding, 'writer synthesizes missing geometry column metadata').toBe('wkb');
});
test('ParquetWriter#synthesizes native GeoParquet encoding from GeoArrow input', async () => {
    const response = await fetchFile(new URL('../../geoarrow/test/data/geoarrow/point.arrow', import.meta.url).href);
    const arrayBuffer = await response.arrayBuffer();
    const pointTable = { shape: 'arrow-table' as const, data: arrow.tableFromIPC(arrayBuffer) };
    const parquetBuffer = await encode(pointTable, ParquetWriter, {
        core: { worker: false }
    });
    const newTable = (await load(parquetBuffer, ParquetLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table' }
    })) as ArrowTable;
    const geoMetadata = getGeoMetadata(newTable.schema?.metadata);
    expect(geoMetadata?.columns.geometry.encoding, 'writer synthesizes native GeoParquet encoding').toBe('point');
    expect(geoMetadata?.columns.geometry.geometry_types, 'writer infers native geometry type').toEqual(['Point']);
    expect(getGeometryColumnsFromSchema(newTable.schema!).geometry?.encoding, 'read path preserves native GeoArrow field metadata').toBe('geoarrow.point');
});
function createArrowTable(): ArrowTable {
    const utf8Vector = arrow.vectorFromArray(['a', 'b', 'c', 'd'], new arrow.Utf8());
    const boolVector = arrow.vectorFromArray([true, true, false, false], new arrow.Bool());
    const uint8Vector = arrow.vectorFromArray([1, 2, 3, 4], new arrow.Uint8());
    const int32Vector = arrow.vectorFromArray([0, -2147483638, 2147483637, 1], new arrow.Uint32());
    const table = new arrow.Table({ utf8Vector, uint8Vector, int32Vector, boolVector });
    return { shape: 'arrow-table', data: table };
}
function createGeoArrowWKBTable(metadataOverrides?: {
    geo?: Record<string, unknown>;
}): ArrowTable {
    const geometryBytes = new Uint8Array(convertGeometryToWKB({
        type: 'Point',
        coordinates: [1, 2]
    }));
    const baseTable = arrow.tableFromArrays({
        id: [1],
        geometry: [geometryBytes]
    });
    const fields = baseTable.schema.fields.map(field => field.name === 'geometry'
        ? field.clone({
            metadata: new Map([
                ['ARROW:extension:name', 'geoarrow.wkb'],
                ['ARROW:extension:metadata', '{}']
            ])
        })
        : field);
    const schemaMetadata = new Map<string, string>();
    if (metadataOverrides?.geo) {
        schemaMetadata.set('geo', JSON.stringify(metadataOverrides.geo));
    }
    return {
        shape: 'arrow-table',
        data: new arrow.Table(new arrow.Schema(fields, schemaMetadata, baseTable.schema.dictionaries, baseTable.schema.metadataVersion), baseTable.batches)
    };
}
