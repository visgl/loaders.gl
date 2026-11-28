// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, type RecordBatch} from 'apache-arrow';
import type {Schema} from '@loaders.gl/core/schema';
import {makeTextDecoderIterator, toArrayBufferIterator} from '@loaders.gl/core/loader-utils';
import {ArrowTableBuilder, updateNativeArrowTableMetadata} from '@loaders.gl/core/schema-utils';
import FastStreamingJSONParser, {
  visitJSONArrayCells,
  visitJSONObjectFields
} from '../json-parser/fast-streaming-json-parser';
import {
  makeEmptyFieldArrowTable,
  makeJSONArrowFieldAppender,
  makeJSONArrowExtraCellHandler,
  makeJSONArrowSchemaInferer,
  type JSONArrowConversionOptions
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
  batchSize: number | 'auto',
  options: JSONArrowConversionOptions
): AsyncIterable<RecordBatch> {
  const parser = createJSONArrowParser(declaredSchema, jsonpaths, batchSize, options);
  for await (const chunk of makeTextDecoderIterator(toArrayBufferIterator(input))) {
    yield* parser.write(chunk);
  }
  yield* parser.finish();
}

/** Parses a complete document with the shared text tokenizer and column writers. */
export function parseDirectJSONArrowText(
  text: string,
  declaredSchema: Schema | undefined,
  options: JSONArrowConversionOptions
): Table {
  let rowTable = false;
  if (text.trimStart().startsWith('{')) {
    visitJSONObjectFields(text, (name, start, end) => {
      if (name === 'shape') {
        const shape: unknown = JSON.parse(text.slice(start, end));
        rowTable = shape === 'object-row-table' || shape === 'array-row-table';
      }
    });
  }
  const parser = createJSONArrowParser(
    declaredSchema,
    rowTable ? ['$.data'] : undefined,
    'auto',
    options,
    true
  );
  return new Table([...parser.write(text), ...parser.finish()]);
}

/** Creates the shared tokenizer and Arrow writer for a single input. */
function createJSONArrowParser(
  declaredSchema: Schema | undefined,
  jsonpaths: string[] | undefined,
  batchSize: number | 'auto',
  options: JSONArrowConversionOptions,
  wholeFile = false
) {
  const builderOptions = {viewTypes: options.arrowConversion?.viewTypes};
  let schema = declaredSchema;
  let builder = schema ? new ArrowTableBuilder(schema, builderOptions) : undefined;
  let matcher = schema ? compileDirectJSONArrowRow(schema) : null;
  let decoders = schema?.fields.map(
    field => SCALAR_DECODERS[field.type as keyof typeof SCALAR_DECODERS]
  );
  let appendFields =
    builder && schema ? makeJSONArrowFieldAppender(builder, schema, options) : undefined;
  const inferer = makeJSONArrowSchemaInferer();
  const columns = new Map<string, unknown[]>();
  let inferredRows = 0;
  let seenRow = false;
  const rawJSONFields = new Set(
    (wholeFile ? undefined : declaredSchema)?.fields
      .filter(field => field.type === 'utf8')
      .map(field => field.name)
  );
  const buffered: RecordBatch[] = [];
  const fields = new Map<string, unknown>();
  const handleExtraCell = makeJSONArrowExtraCellHandler(options);

  /** Freezes the inferred schema and appends the buffered columns to their Arrow builders. */
  function finishInference(): void {
    schema = inferer.getSchema();
    if (wholeFile) {
      const wrapper = parser.getPartialResult() as {shape?: string; schema?: Schema} | null;
      if (wrapper?.shape === 'object-row-table' || wrapper?.shape === 'array-row-table') {
        schema.metadata = wrapper.schema?.metadata ?? {};
      }
    }
    builder = new ArrowTableBuilder(schema, builderOptions);
    matcher = compileDirectJSONArrowRow(schema);
    decoders = schema.fields.map(
      field => SCALAR_DECODERS[field.type as keyof typeof SCALAR_DECODERS]
    );
    const appendInitialFields = makeJSONArrowFieldAppender(builder, schema, {
      ...options,
      allowMissingNullableFields: true
    });
    for (let row = 0; row < inferredRows; row++) {
      fields.clear();
      for (const [name, column] of columns) {
        if (row in column) fields.set(name, column[row]);
      }
      appendInitialFields(fields);
    }
    columns.clear();
    inferredRows = 0;
    appendFields = makeJSONArrowFieldAppender(builder, schema, options);
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
    seenRow = true;
    for (let index = 0; index < schema.fields.length; index++) {
      const token = tokens[index + 1];
      builder.arrowBuilders[index].append(token === 'null' ? null : decoders[index](token));
    }
    builder.length++;
    flushOnRowLimit();
    return nextOffset;
  }

  const parser = new FastStreamingJSONParser(
    {jsonpaths, metadata: true, strict: true},
    {
      match,
      consume(text) {
        if (match(text, 0) > 0) return;
        fields.clear();
        if (wholeFile && !seenRow && text[0] !== '{' && text[0] !== '[') {
          throw new Error(
            'JSONTableLoader: expected a JSON row array or an object containing a JSON row array'
          );
        }
        seenRow = true;
        if (text[0] === '[') {
          if (
            !visitJSONArrayCells(text, (index, start, end) => {
              const value: unknown = JSON.parse(text.slice(start, end));
              const name = declaredSchema?.fields[index]?.name;
              if (declaredSchema && name === undefined) {
                handleExtraCell(index);
                return;
              }
              fields.set(name ?? `column${index + 1}`, value);
            })
          ) {
            throw new SyntaxError('Invalid positional row in streamed JSON array');
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
            const value: unknown = JSON.parse(source);
            const raw = (source[0] === '{' || source[0] === '[') && rawJSONFields.has(name);
            fields.set(name, raw ? source : value);
          })
        ) {
          throw new SyntaxError('Invalid object in streamed JSON array');
        }
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

  return {
    /** Consumes a text chunk and emits any complete streaming batches. */
    *write(chunk: string): Iterable<RecordBatch> {
      parser.write(chunk);
      if (wholeFile) return;
      if (batchSize === 'auto') flush();
      yield* emitBufferedBatches();
    },
    /** Validates the document ending and emits the final data and metadata. */
    *finish(): Iterable<RecordBatch> {
      parser.close();
      const path = parser.getStreamingJsonPathAsString() ?? undefined;
      if (wholeFile && !path) {
        throw new Error(
          'JSONTableLoader: expected a JSON row array or an object containing a JSON row array'
        );
      }
      flush();
      yield* emitBufferedBatches();
      const metadata = getJSONContainerMetadata(parser.getPartialResult(), path);
      if (lastMetadata !== JSON.stringify(metadata)) {
        const finalBuilder = builder ?? new ArrowTableBuilder({fields: [], metadata: {}});
        yield* updateNativeArrowTableMetadata(finalBuilder.finishTable(), metadata).batches;
      }
    }
  };
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
