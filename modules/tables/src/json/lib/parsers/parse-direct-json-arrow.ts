// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, type RecordBatch} from 'apache-arrow';
import type {Schema} from '@loaders.gl/core/schema';
import {makeTextDecoderIterator, toArrayBufferIterator} from '@loaders.gl/core/loader-utils';
import {ArrowTableBuilder, updateNativeArrowTableMetadata} from '@loaders.gl/core/schema-utils';
import FastStreamingJSONParser, {
  visitJSONObjectFields
} from '../json-parser/fast-streaming-json-parser';
import {
  makeEmptyFieldArrowTable,
  makeJSONArrowFieldAppender,
  makeJSONArrowSchemaInferer
} from './convert-row-table-to-arrow';
import {getJSONContainerMetadata} from './json-container-metadata';

const WHITESPACE = String.raw`[\x20\t\n\r]*`;
const NUMBER = String.raw`-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?`;
const STRING = String.raw`"(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[\da-fA-F]{4}))*"`;

const SCALAR_TOKENS = {float64: NUMBER, utf8: STRING, bool: 'true|false'};
const SCALAR_DECODERS = {
  float64: Number,
  utf8: (token: string): string => (token.includes('\\') ? JSON.parse(token) : token.slice(1, -1)),
  bool: (token: string): boolean => token === 'true'
};

/** Compiles the common ordered scalar object shape without allocating decoded row objects. */
function compileDirectJSONArrowRow(schema: Schema): RegExp | null {
  if (
    !schema.fields.length ||
    new Set(schema.fields.map(field => field.name)).size !== schema.fields.length
  ) {
    return null;
  }
  const fields: string[] = [];
  for (const field of schema.fields) {
    if (typeof field.type !== 'string' || !Object.hasOwn(SCALAR_TOKENS, field.type)) return null;
    const type = field.type as keyof typeof SCALAR_TOKENS;
    const key = JSON.stringify(field.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const token = SCALAR_TOKENS[type];
    fields.push(
      key + WHITESPACE + ':' + WHITESPACE + '(' + token + (field.nullable ? '|null)' : ')')
    );
  }
  return new RegExp(
    String.raw`\{` +
      WHITESPACE +
      fields.join(WHITESPACE + ',' + WHITESPACE) +
      WHITESPACE +
      String.raw`\}`,
    'y'
  );
}

/** Streams JSON fields into Arrow, buffering columns only while inferring the first batch. */
export async function* parseDirectJSONArrowInBatches(
  input:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  declaredSchema: Schema | undefined,
  jsonpaths: string[] | undefined,
  batchSize: number | 'auto'
): AsyncIterable<RecordBatch> {
  let schema = declaredSchema;
  let builder = schema ? new ArrowTableBuilder(schema) : undefined;
  let matcher = schema ? compileDirectJSONArrowRow(schema) : null;
  let decoders = schema?.fields.map(
    field => SCALAR_DECODERS[field.type as keyof typeof SCALAR_DECODERS]
  );
  let appendFields = builder && schema ? makeJSONArrowFieldAppender(builder, schema) : undefined;
  const inferer = makeJSONArrowSchemaInferer();
  const columns = new Map<string, unknown[]>();
  let inferredRows = 0;
  let batchFieldNames: string[] | undefined;
  const rawJSONFields = new Set(
    declaredSchema?.fields.filter(field => field.type === 'utf8').map(field => field.name)
  );
  const buffered: RecordBatch[] = [];
  const fields = new Map<string, unknown>();

  /** Freezes the inferred schema and appends the buffered columns to their Arrow builders. */
  function finishInference(): void {
    schema = inferer.getSchema();
    builder = new ArrowTableBuilder(schema);
    matcher = compileDirectJSONArrowRow(schema);
    decoders = schema.fields.map(
      field => SCALAR_DECODERS[field.type as keyof typeof SCALAR_DECODERS]
    );
    const appendInitialFields = makeJSONArrowFieldAppender(builder, schema, true);
    for (let row = 0; row < inferredRows; row++) {
      fields.clear();
      for (const [name, column] of columns) {
        if (row in column) fields.set(name, column[row]);
      }
      appendInitialFields(fields);
    }
    columns.clear();
    inferredRows = 0;
    appendFields = makeJSONArrowFieldAppender(builder, schema);
  }

  /** Queues the current batch with the frozen schema. */
  function flush(): void {
    if (!builder && inferredRows) finishInference();
    if (!builder?.length || !schema) return;
    const batch = schema.fields.length
      ? builder.flushBatch()
      : makeEmptyFieldArrowTable(schema, builder.length).batches[0];
    if (batch) buffered.push(batch);
    builder.length = 0;
    batchFieldNames = undefined;
  }

  /** Emits a complete batch when the configured row limit is reached. */
  function flushOnRowLimit(): void {
    if (typeof batchSize === 'number' && (builder?.length ?? inferredRows) >= batchSize) flush();
  }

  /** Appends an ordered scalar object straight from a compiled source match. */
  function match(source: string, offset: number): number {
    if (!matcher || !builder || !schema || !decoders) return offset;
    matcher.lastIndex = offset;
    const tokens = matcher.exec(source);
    if (!tokens) return offset;
    const nextOffset = matcher.lastIndex;
    batchFieldNames ??= schema.fields.map(field => field.name);
    for (let index = 0; index < schema.fields.length; index++) {
      const token = tokens[index + 1];
      builder.arrowBuilders[index].append(token === 'null' ? null : decoders[index](token));
    }
    builder.length++;
    flushOnRowLimit();
    return nextOffset;
  }

  const parser = new FastStreamingJSONParser(
    {jsonpaths, metadata: true},
    {
      match,
      consume(text) {
        if (match(text, 0) > 0) return;
        fields.clear();
        try {
          if (text[0] === '[') {
            const values: unknown[] = JSON.parse(text);
            batchFieldNames ??= values.map((_value, index) => `column${index + 1}`);
            for (let index = 0; index < batchFieldNames.length; index++) {
              fields.set(batchFieldNames[index], values[index]);
            }
          } else if (text[0] !== '{') {
            const value: unknown = JSON.parse(text);
            if (typeof value === 'string') {
              for (let index = 0; index < value.length; index++) {
                fields.set(String(index), value[index]);
              }
            }
          } else if (
            !visitJSONObjectFields(text, (name, start, end) => {
              const source = text.slice(start, end);
              const raw = (source[0] === '{' || source[0] === '[') && rawJSONFields.has(name);
              fields.set(name, raw ? source : JSON.parse(source));
            })
          ) {
            return;
          }
        } catch {
          return;
        }
        batchFieldNames ??= orderJSONObjectFieldNames(fields.keys());
        if (appendFields) {
          appendFields(fields);
        } else {
          const order = orderJSONObjectFieldNames(fields.keys());
          for (const name of order) {
            const value = fields.get(name);
            const column = columns.get(name) ?? [];
            column[inferredRows] = value;
            columns.set(name, column);
          }
          inferer.addFields(fields, order);
          inferredRows++;
        }
        flushOnRowLimit();
      }
    }
  );

  let lastMetadata: string | undefined;
  /** Applies the current wrapper metadata to buffered Arrow batches. */
  function* emitBufferedBatches(): Iterable<RecordBatch> {
    const path = parser.getStreamingJsonPathAsString() ?? undefined;
    const metadata = getJSONContainerMetadata(parser.getPartialResult(), path);
    for (const buffer of buffered) {
      const batch = updateNativeArrowTableMetadata(new Table(buffer), metadata).batches[0];
      if (path) batch.metadata.set('jsonpath', path);
      yield batch;
    }
    if (buffered.length) lastMetadata = JSON.stringify(metadata);
    buffered.length = 0;
  }

  for await (const chunk of makeTextDecoderIterator(toArrayBufferIterator(input))) {
    parser.write(chunk);
    if (batchSize === 'auto') flush();
    yield* emitBufferedBatches();
  }
  parser.close();
  flush();
  yield* emitBufferedBatches();
  const path = parser.getStreamingJsonPathAsString() ?? undefined;
  const metadata = getJSONContainerMetadata(parser.getPartialResult(), path);
  if (lastMetadata !== JSON.stringify(metadata)) {
    const finalBuilder = builder ?? new ArrowTableBuilder({fields: [], metadata: {}});
    yield* updateNativeArrowTableMetadata(finalBuilder.finishTable(), metadata).batches;
  }
}

/** Matches JavaScript's own-property enumeration order for integer field names. */
function orderJSONObjectFieldNames(names: Iterable<string>): string[] {
  const integerNames: string[] = [];
  const otherNames: string[] = [];
  for (const name of names) {
    const index = Number(name);
    if (index >= 0 && index < 4294967295 && Number.isInteger(index) && String(index) === name) {
      integerNames.push(name);
    } else {
      otherNames.push(name);
    }
  }
  integerNames.sort((left, right) => Number(left) - Number(right));
  return integerNames.concat(otherNames);
}
