// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
import { validateLoader } from 'test/common/conformance';
import * as arrow from 'apache-arrow';
import { ParquetJSLoader, ParquetLoader } from '@loaders.gl/parquet';
import { ParquetJSLoaderWithParser } from '@loaders.gl/parquet/parquet-js-loader';
import { ParquetLoaderWithParser } from '@loaders.gl/parquet/parquet-loader';
import { isBrowser, load, preload, setLoaderOptions } from '@loaders.gl/core';
import { SUPPORTED_FILES, UNSUPPORTED_FILES, ENCRYPTED_FILES, BAD_FILES } from './data/files';
import { ALL_TYPES_DICTIONARY_EXPECTED, ALL_TYPES_PLAIN_EXPECTED, ALL_TYPES_PLAIN_SNAPPY_EXPECTED, BINARY_EXPECTED, DECIMAL_EXPECTED, DICT_EXPECTED, LIST_COLUMNS_EXPECTED, NESTED_LIST_EXPECTED, NESTED_MAPS_EXPECTED, NO_NULLABLE_EXPECTED, NULLABLE_EXPECTED, NULLS_EXPECTED, REPEATED_NO_ANNOTATION_EXPECTED, LZ4_RAW_COMPRESSED_LARGER_FIRST_EXPECTED, LZ4_RAW_COMPRESSED_LARGER_LAST_EXPECTED, LZ4_RAW_COMPRESSED_EXPECTED, NON_HADOOP_LZ4_COMPRESSED_EXPECTED } from './expected';
const PARQUET_DIR = '@loaders.gl/parquet/test/data/apache';
setLoaderOptions({ _workerType: 'test' });
function getParquetLoaderOptions(_url: string) {
    return {
        parquet: {},
        core: { worker: false }
    };
}
test('ParquetJSLoader#loader objects', () => {
    validateLoader( ParquetJSLoader, 'ParquetJSLoader');
});
test('Parquet loaders preload explicit parser implementations', async () => {
    expect(await preload(ParquetLoader), 'primary ParquetLoader resolves the WASM parser').toBe(ParquetLoaderWithParser);
    expect(await preload(ParquetJSLoader), 'fallback ParquetJSLoader resolves the TypeScript parser').toBe(ParquetJSLoaderWithParser);
    expect(ParquetJSLoaderWithParser.id, 'fallback parser preserves loader id').toBe(ParquetJSLoader.id);
    expect(ParquetJSLoader.worker, 'fallback parser stays on the main thread').toBe(false);
});
test('ParquetJSLoader#load alltypes_dictionary file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(2);
        expect(table.data).toEqual(ALL_TYPES_DICTIONARY_EXPECTED);
    }
});
test('ParquetJSLoader#load supports arrow-table shape', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
    const table = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table' }
    });
    expect(table.shape).toBe('arrow-table');
    if (table.shape === 'arrow-table') {
        expect(table.data.numRows).toBe(2);
        const identifierField = table.data.schema.fields.find(field => field.name === 'id');
        expect(Object.fromEntries(identifierField?.metadata || []), 'preserves serialized Parquet field metadata in the Arrow schema').toEqual({
            type: 'INT32',
            optional: 'true',
            repeated: 'false',
            encoding: 'PLAIN',
            compression: 'UNCOMPRESSED'
        });
    }
});
test('ParquetJSLoader#loads the dictionary benchmark fixture', async () => {
    const url = '@loaders.gl/parquet/test/data/benchmark-dictionary.parquet';
    const table = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table' }
    });
    expect(table.shape).toBe('arrow-table');
    if (table.shape === 'arrow-table') {
        expect(table.data.numRows, 'loads every row across all row groups').toBe(20000);
        expect(table.data.schema.fields.map((field) => field.name), 'preserves the benchmark schema').toEqual(['category', 'region', 'nullableLabel', 'quantity', 'price']);
        expect(table.data.getChild('category')?.get(0), 'decodes dictionary strings').toBe('alpha');
        expect(table.data.getChild('nullableLabel')?.get(0), 'decodes nullable dictionary data').toBe(null);
        expect(table.data.getChild('quantity')?.get(19999), 'decodes nullable numeric data').toBe(999);
    }
});
test('ParquetJSLoader#arrow-table preserves ranged dictionary values', async () => {
    const url = '@loaders.gl/parquet/test/data/benchmark-dictionary.parquet';
    const parquetOptions = {
        shape: 'arrow-table' as const,
        columns: ['category', 'nullableLabel', 'quantity', 'price'],
        offset: 4094,
        limit: 5
    };
    const arrowTable = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: parquetOptions
    });
    const objectRowTable = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { ...parquetOptions, shape: 'object-row-table' }
    });
    expect(arrowTable.shape).toBe('arrow-table');
    expect(objectRowTable.shape).toBe('object-row-table');
    if (arrowTable.shape === 'arrow-table' && objectRowTable.shape === 'object-row-table') {
        expect(arrowTable.data.batches.map(batch => batch.numRows), 'retains row-group boundaries').toEqual([2, 3]);
        for (const columnName of parquetOptions.columns) {
            expect(Array.from(arrowTable.data.getChild(columnName) || []), `${columnName} values and nulls match object-row decoding`).toEqual(objectRowTable.data.map(row => row[columnName] ?? null));
        }
    }
});
test('ParquetJSLoader#arrow-table preserves ranged physical integer values', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/delta_binary_packed.parquet';
    const columns = ['bitwidth0', 'bitwidth32', 'bitwidth64', 'int_value'];
    const parquetOptions = {
        shape: 'arrow-table' as const,
        columns,
        offset: 3,
        limit: 5
    };
    const arrowTable = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: parquetOptions
    });
    const objectRowTable = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { ...parquetOptions, shape: 'object-row-table' }
    });
    expect(arrowTable.shape).toBe('arrow-table');
    expect(objectRowTable.shape).toBe('object-row-table');
    if (arrowTable.shape === 'arrow-table' && objectRowTable.shape === 'object-row-table') {
        for (const columnName of columns) {
            expect(Array.from(arrowTable.data.getChild(columnName) || []), `${columnName} values and nulls match object-row decoding`).toEqual(objectRowTable.data.map(row => row[columnName] ?? null));
        }
    }
});
test('ParquetJSLoader#load arrow-table preserves schema for empty results', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
    const table = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table', limit: 0 }
    });
    expect(table.shape).toBe('arrow-table');
    if (table.shape === 'arrow-table') {
        expect(table.data.numRows).toBe(0);
        expect(table.schema.fields.length > 0, 'loaders.gl schema retains the file fields').toBeTruthy();
        expect(table.data.schema.fields.map((field) => field.name), 'Arrow schema retains the same file fields').toEqual(table.schema.fields.map((field) => field.name));
    }
});
test('ParquetJSLoader#arrow-table applies projection, offset, and limit', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
    const options = {
        core: { worker: false },
        parquet: {
            shape: 'arrow-table' as const,
            columns: ['id', 'bool_col'],
            offset: 2,
            limit: 3
        }
    };
    const arrowTable = await load(url, ParquetJSLoader, options);
    const objectRowTable = await load(url, ParquetJSLoader, {
        ...options,
        parquet: { ...options.parquet, shape: 'object-row-table' }
    });
    expect(arrowTable.shape).toBe('arrow-table');
    expect(objectRowTable.shape).toBe('object-row-table');
    if (arrowTable.shape === 'arrow-table' && objectRowTable.shape === 'object-row-table') {
        expect(arrowTable.data.numRows, 'returns the requested row range').toBe(3);
        expect(arrowTable.schema?.fields.map(field => field.name), 'returns only projected columns').toEqual(['id', 'bool_col']);
        expect(arrowTable.data.getChild('id')?.toArray(), 'direct Arrow values match object-row decoding').toEqual(new Int32Array(objectRowTable.data.map(row => row.id)));
    }
});
test('ParquetJSLoader#arrow-table preserves rows for an empty projection', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
    const table = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: {
            shape: 'arrow-table',
            columns: ['missing_column'],
            offset: 2,
            limit: 3
        }
    });
    expect(table.shape).toBe('arrow-table');
    if (table.shape === 'arrow-table') {
        expect(table.data.numRows, 'preserves the selected row count').toBe(3);
        expect(table.data.numCols, 'returns no projected columns').toBe(0);
        expect(table.data.toArray().map(record => Object.fromEntries(Object.entries(record))), 'retains empty records for selected rows').toEqual([{}, {}, {}]);
    }
});
test('ParquetJSLoader#arrow-table materializes native timestamp logical values', async () => {
    const url = '@loaders.gl/parquet/test/data/fruits.parquet';
    const table = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table', columns: ['date'], limit: 1 }
    });
    expect(table.shape).toBe('arrow-table');
    if (table.shape === 'arrow-table') {
        expect(table.data.numRows).toBe(1);
        expect(table.data.getChild('date')?.type instanceof arrow.TimestampMicrosecond, 'uses an Arrow TimestampMicrosecond vector').toBeTruthy();
        expect(table.data.getChild('date')?.get(0), 'returns the timestamp in milliseconds').toBe(1625040045218);
    }
});
test('ParquetJSLoader#arrow-table preserves ranged optional DELTA_BYTE_ARRAY Utf8 values', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/delta_byte_array.parquet';
    const columns = ['c_customer_id', 'c_email_address'];
    const parquetOptions = { shape: 'arrow-table' as const, columns, offset: 3, limit: 5, batchSize: 2 };
    const arrowTable = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: parquetOptions
    });
    const objectRowTable = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { ...parquetOptions, shape: 'object-row-table' }
    });
    expect(arrowTable.shape).toBe('arrow-table');
    expect(objectRowTable.shape).toBe('object-row-table');
    if (arrowTable.shape === 'arrow-table' && objectRowTable.shape === 'object-row-table') {
        expect(arrowTable.data.batches.map(batch => batch.numRows), 'retains requested Arrow batches').toEqual([2, 2, 1]);
        for (const columnName of columns) {
            const vector = arrowTable.data.getChild(columnName);
            expect(vector, `${columnName} Arrow vector is present`).toBeTruthy();
            expect(vector?.toArray(), `${columnName} values and nulls match object-row decoding`).toEqual(objectRowTable.data.map(row => row[columnName] ?? null));
        }
    }
});
test('ParquetJSLoader#load alltypes_plain file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(8);
        expect(table.data).toEqual(ALL_TYPES_PLAIN_EXPECTED);
    }
});
test('ParquetJSLoader#load alltypes_plain_snappy file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.snappy.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(2);
        expect(table.data).toEqual(ALL_TYPES_PLAIN_SNAPPY_EXPECTED);
    }
});
test('ParquetJSLoader#load binary file as an Arrow table', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/binary.parquet';
    const table = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table', offset: 2, limit: 4, batchSize: 2 }
    });
    expect(table.shape).toBe('arrow-table');
    if (table.shape === 'arrow-table') {
        expect(table.data.numRows).toBe(4);
        expect(table.data.getChild('foo')?.toArray()).toEqual(BINARY_EXPECTED()
            .slice(2, 6)
            .map(row => row.foo));
        expect(table.data.batches.map(batch => batch.numRows), 'retains requested Arrow batches').toEqual([2, 2]);
    }
});
test('ParquetJSLoader#load binary file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/binary.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(12);
        expect(table.data).toEqual(BINARY_EXPECTED());
    }
});
test('ParquetJSLoader#load dict file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/dict-page-offset-zero.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(39);
        expect(table.data).toEqual(DICT_EXPECTED());
    }
});
test('ParquetJSLoader#load list_columns file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/list_columns.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(3);
        expect(table.data).toEqual(LIST_COLUMNS_EXPECTED);
    }
});
// TODO fix malformed dictionary before adding deep equal test
test('ParquetJSLoader#load nation file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/nation.dict-malformed.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table).toBeTruthy();
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(25);
    }
});
test('ParquetJSLoader#load nested_lists file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/nested_lists.snappy.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(3);
        expect(table.data).toEqual(NESTED_LIST_EXPECTED);
    }
});
test('ParquetJSLoader#load nested_lists file as an Arrow table', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/nested_lists.snappy.parquet';
    const table = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table' }
    });
    expect(table.shape).toBe('arrow-table');
    if (table.shape === 'arrow-table') {
        const firstRow = JSON.parse(JSON.stringify(table.data.get(0)?.toJSON())) as {
            a: {
                list: Array<{
                    element: {
                        list: unknown[];
                    };
                }>;
            };
        };
        expect(table.data.numRows).toBe(3);
        expect(JSON.stringify(table.schema).includes('"type":"list"'), 'schema contains Arrow lists').toBeTruthy();
        expect(firstRow.a.list.length, 'outer repeated group is preserved').toBe(2);
        expect(firstRow.a.list[0].element.list.length, 'nested repeated group is preserved').toBe(2);
    }
});
test('ParquetJSLoader#load nested_maps file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/nested_maps.snappy.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(6);
        expect(table.data).toEqual(NESTED_MAPS_EXPECTED);
    }
});
test('ParquetJSLoader#load nonnullable file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/nonnullable.impala.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(1);
        expect(table.data).toEqual(NO_NULLABLE_EXPECTED);
    }
});
test('ParquetJSLoader#load nullable file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/nullable.impala.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(7);
        expect(table.data).toEqual(NULLABLE_EXPECTED);
    }
});
test('ParquetJSLoader#load nulls file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/nulls.snappy.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(8);
        expect(table.data).toEqual(NULLS_EXPECTED);
    }
});
test('ParquetJSLoader#decimal files', async () => {
    const urls = [
        '@loaders.gl/parquet/test/data/apache/good/byte_array_decimal.parquet',
        '@loaders.gl/parquet/test/data/apache/good/fixed_length_decimal.parquet',
        '@loaders.gl/parquet/test/data/apache/good/fixed_length_decimal_legacy.parquet',
        '@loaders.gl/parquet/test/data/apache/good/int32_decimal.parquet',
        '@loaders.gl/parquet/test/data/apache/good/int64_decimal.parquet'
    ];
    for (const url of urls) {
        const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
        expect(table.shape).toBe('object-row-table');
        if (table.shape === 'object-row-table') {
            expect(table.data).toEqual(DECIMAL_EXPECTED);
        }
    }
});
test('ParquetJSLoader#load repeated_no_annotation file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/repeated_no_annotation.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(6);
        expect(table.data).toEqual(REPEATED_NO_ANNOTATION_EXPECTED);
    }
});
test('ParquetJSLoader#load repeated_no_annotation file as an Arrow table', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/repeated_no_annotation.parquet';
    const table = await load(url, ParquetJSLoader, {
        core: { worker: false },
        parquet: { shape: 'arrow-table' }
    });
    expect(table.shape).toBe('arrow-table');
    if (table.shape === 'arrow-table') {
        const lastRow = JSON.parse(JSON.stringify(table.data.get(5)?.toJSON(), (_key, value) => typeof value === 'bigint' ? value.toString() : value)) as {
            phoneNumbers: {
                phone: Array<{
                    number: string;
                    kind: string | null;
                }>;
            };
        };
        expect(table.data.numRows).toBe(6);
        expect(JSON.stringify(table.schema).includes('"type":"list"'), 'schema contains Arrow lists').toBeTruthy();
        expect(lastRow.phoneNumbers.phone.length, 'all repeated structs are retained').toBe(3);
        expect(lastRow.phoneNumbers.phone[2].kind, 'repeated struct values are retained').toBe('mobile');
    }
});
test('ParquetJSLoader#load lz4_raw_compressed file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(4);
        expect(table.data).toEqual(LZ4_RAW_COMPRESSED_EXPECTED);
    }
});
test('ParquetJSLoader#load lz4_raw_compressed_larger file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed_larger.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(10000);
        // Compare only first and last items in data because file is huge.
        expect(table.data[0]).toEqual(LZ4_RAW_COMPRESSED_LARGER_FIRST_EXPECTED);
        expect(table.data[9999]).toEqual(LZ4_RAW_COMPRESSED_LARGER_LAST_EXPECTED);
    }
});
test('ParquetJSLoader#load non_hadoop_lz4_compressed file', async () => {
    const url = '@loaders.gl/parquet/test/data/apache/good/non_hadoop_lz4_compressed.parquet';
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(4);
        expect(table.data).toEqual(NON_HADOOP_LZ4_COMPRESSED_EXPECTED);
    }
});
test('ParquetJSLoader#load', async () => {
    // t.comment('SUPPORTED FILES');
    for (const { title, path } of SUPPORTED_FILES) {
        const url = `${PARQUET_DIR}/${path}`;
        const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
        expect(table, `GOOD(${title})`).toBeTruthy();
    }
    // t.comment('UNSUPPORTED FILES');
    for (const { title, path } of UNSUPPORTED_FILES) {
        const url = `${PARQUET_DIR}/${path}`;
        try {
            const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
            expect(table, `GOOD(${title})`).toBeTruthy();
        }
        catch (error) {
            // @ts-ignore TS2571
            expect(true, `UNSUPPORTED(${title}): ${error.message}`).toBe(true);
        }
    }
    // t.comment('ENCRYPTED FILES');
    for (const { title, path } of ENCRYPTED_FILES) {
        const url = `${PARQUET_DIR}/${path}`;
        try {
            const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
            expect(table, `GOOD(${title})`).toBeTruthy();
        }
        catch (error) {
            // @ts-ignore TS2571
            expect(true, `ENCRYPTED(${title}): ${error.message}`).toBe(true);
        }
    }
    // t.comment('BAD FILES');
    for (const { title, path } of BAD_FILES) {
        const url = `${PARQUET_DIR}/${path}`;
        try {
            const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
            expect(table, `GOOD(${title})`).toBeTruthy();
        }
        catch (error) {
            // @ts-ignore TS2571
            expect(true, `BAD FILE(${title}): ${error.message}`).toBe(true);
        }
    }
});
test('ParquetJSLoader#loads through the explicit TypeScript implementation', async () => {
    const url = '@loaders.gl/parquet/test/data/geoparquet/example.parquet';
    const table = await load(url, ParquetJSLoader, {
        parquet: {
            limit: 2
        },
        core: { worker: false }
    });
    expect(table.shape).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
        expect(table.data.length).toBe(2);
        expect(typeof table.data[0].name).toBe('string');
    }
});
