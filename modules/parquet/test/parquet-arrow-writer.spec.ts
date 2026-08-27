// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
import { encode, load } from '@loaders.gl/core';
import type { ArrowTable, ObjectRowTable } from '@loaders.gl/schema';
import * as parquet from '@loaders.gl/parquet';
import * as bundledParquet from '@loaders.gl/parquet/bundled';
import * as parquetSource from '@loaders.gl/parquet/parquet-source-loader';
import * as unbundledParquet from '@loaders.gl/parquet/unbundled';
import { ParquetJSLoader, ParquetJSWriter, ParquetLoader, ParquetWriter } from '@loaders.gl/parquet';
import * as arrow from 'apache-arrow';
test('ParquetWriter#writer objects', () => {
    expect(ParquetWriter, 'ParquetWriter').toBeTruthy();
    expect(ParquetJSLoader, 'ParquetJSLoader').toBeTruthy();
    expect(ParquetJSWriter, 'ParquetJSWriter').toBeTruthy();
});
test('ParquetSource#public exports', () => {
    expect(parquet.ParquetSourceLoader, 'root exports lightweight ParquetSourceLoader metadata').toBeTruthy();
    expect('ParquetSource' in parquet, 'root does not export runtime ParquetSource').toBeFalsy();
    expect(parquet.PARQUET_SOURCE_CAPABILITIES, 'root exports source capabilities').toBeTruthy();
    expect(parquetSource.ParquetSourceLoader, 'source subpath exports runtime loader').toBeTruthy();
    expect(parquetSource.ParquetSource, 'source subpath exports runtime source').toBeTruthy();
    expect(parquetSource.PARQUET_SOURCE_CAPABILITIES, 'source subpath exports capabilities').toBeTruthy();
    expect(bundledParquet.ParquetSourceLoader, 'bundled entry point exports ParquetSourceLoader').toBeTruthy();
    expect(bundledParquet.ParquetSource, 'bundled entry point exports ParquetSource').toBeTruthy();
    expect(bundledParquet.PARQUET_SOURCE_CAPABILITIES, 'bundled exports source capabilities').toBeTruthy();
    expect(unbundledParquet.ParquetSourceLoader, 'unbundled entry point exports ParquetSourceLoader').toBeTruthy();
    expect(unbundledParquet.ParquetSource, 'unbundled entry point exports ParquetSource').toBeTruthy();
    expect(unbundledParquet.PARQUET_SOURCE_CAPABILITIES, 'unbundled exports source capabilities').toBeTruthy();
});
test('ParquetWriter#removed Arrow variant exports are absent', () => {
    expect('ParquetArrowLoader' in parquet, 'root does not export ParquetArrowLoader').toBeFalsy();
    expect('ParquetArrowWorkerLoader' in parquet, 'root does not export ParquetArrowWorkerLoader').toBeFalsy();
    expect('ParquetArrowLoaderOptions' in parquet, 'root does not export ParquetArrowLoaderOptions').toBeFalsy();
    expect('ParquetArrowWriter' in parquet, 'root does not export ParquetArrowWriter').toBeFalsy();
    expect('ParquetArrowWriterOptions' in parquet, 'root does not export ParquetArrowWriterOptions').toBeFalsy();
    expect('ParquetArrowLoader' in bundledParquet, 'bundled does not export ParquetArrowLoader').toBeFalsy();
    expect('ParquetArrowWorkerLoader' in bundledParquet, 'bundled does not export ParquetArrowWorkerLoader').toBeFalsy();
    expect('ParquetArrowLoader' in unbundledParquet, 'unbundled does not export ParquetArrowLoader').toBeFalsy();
    expect('ParquetArrowWorkerLoader' in unbundledParquet, 'unbundled does not export ParquetArrowWorkerLoader').toBeFalsy();
});
test('ParquetWriter#removed JSON aliases are absent', () => {
    expect('ParquetJSONLoader' in parquet, 'ParquetJSONLoader removed').toBeFalsy();
    expect('ParquetJSONWorkerLoader' in parquet, 'ParquetJSONWorkerLoader removed').toBeFalsy();
    expect('ParquetJSONWriter' in parquet, 'ParquetJSONWriter removed').toBeFalsy();
    expect('_ParquetJSONLoader' in parquet, '_ParquetJSONLoader removed').toBeFalsy();
    expect('_ParquetJSONWriter' in parquet, '_ParquetJSONWriter removed').toBeFalsy();
});
test('ParquetWriter#encodes Arrow tables through primary writer', async () => {
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
test('ParquetWriter#encodes plain JS tables through Arrow adapter', async () => {
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
function createArrowTable(): ArrowTable {
    const utf8Vector = arrow.vectorFromArray(['a', 'b', 'c', 'd'], new arrow.Utf8());
    const boolVector = arrow.vectorFromArray([true, true, false, false], new arrow.Bool());
    const uint8Vector = arrow.vectorFromArray([1, 2, 3, 4], new arrow.Uint8());
    const int32Vector = arrow.vectorFromArray([0, -2147483638, 2147483637, 1], new arrow.Uint32());
    const table = new arrow.Table({ utf8Vector, uint8Vector, int32Vector, boolVector });
    return { shape: 'arrow-table', data: table };
}
