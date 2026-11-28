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
import {makeJSONArrowFieldAppender} from './convert-row-table-to-arrow';
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
export function compileDirectJSONArrowRow(schema: Schema): RegExp | null {
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

/** Streams ordered scalar objects straight into Arrow builders, using row conversion on a miss. */
export async function* parseDirectJSONArrowInBatches(
  input:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  schema: Schema,
  matcher: RegExp,
  jsonpaths: string[] | undefined,
  batchSize: number | 'auto'
): AsyncIterable<RecordBatch> {
  const builder = new ArrowTableBuilder(schema);
  const decoders = schema.fields.map(
    field => SCALAR_DECODERS[field.type as keyof typeof SCALAR_DECODERS]
  );
  const rawJSONFields = new Set(
    schema.fields.filter(field => field.type === 'utf8').map(field => field.name)
  );
  const buffered: RecordBatch[] = [];
  const fields = new Map<string, unknown>();
  const appendFields = makeJSONArrowFieldAppender(builder, schema);

  const flush = () => {
    const batch = builder.flushBatch();
    if (batch) buffered.push(batch);
  };
  const match = (source: string, offset: number): number => {
    matcher.lastIndex = offset;
    const tokens = matcher.exec(source);
    if (!tokens) return offset;
    const nextOffset = matcher.lastIndex;
    for (let index = 0; index < decoders.length; index++) {
      const token = tokens[index + 1];
      builder.arrowBuilders[index].append(token === 'null' ? null : decoders[index](token));
    }
    builder.length++;
    if (typeof batchSize === 'number' && builder.length >= batchSize) flush();
    return nextOffset;
  };
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
            for (const [index, value] of values.entries()) fields.set(`column${index + 1}`, value);
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
        appendFields(fields);
        if (typeof batchSize === 'number' && builder.length >= batchSize) flush();
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
    yield* updateNativeArrowTableMetadata(builder.finishTable(), metadata).batches;
  }
}
