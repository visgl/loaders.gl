// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {GMLFeatureCollection, Geometry} from './lib/parsers/gml/parse-gml';
import {parseGML} from './lib/parsers/gml/parse-gml';
import {GMLLoader as GMLLoaderMetadata} from './gml-loader';

const {preload: _GMLLoaderPreload, ...GMLLoaderMetadataWithoutPreload} = GMLLoaderMetadata;

export type GMLLoaderOptions = LoaderOptions & {
  gml?: {batchSize?: number};
};

/**
 * Loader for the response to the GML GetCapability request
 */
export const GMLLoaderWithParser = {
  ...GMLLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: GMLLoaderOptions) =>
    parseGML(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: GMLLoaderOptions) => parseGML(text, options),
  parseInBatches: parseGMLInBatches
} as const satisfies LoaderWithParser<
  Geometry | GMLFeatureCollection | null,
  GMLFeatureCollection,
  GMLLoaderOptions
>;

/** Parses GML feature-member fragments as they become available from a fetch stream. */
async function* parseGMLInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: GMLLoaderOptions
): AsyncIterable<GMLFeatureCollection> {
  const decoder = new TextDecoder();
  let text = '';
  let features: GMLFeatureCollection['features'] = [];
  const batchSize = options?.gml?.batchSize || 1000;
  const featureMemberPattern =
    /<(?:[A-Za-z_][\w.-]*:)?featureMember\b[^>]*>[\s\S]*?<\/(?:[A-Za-z_][\w.-]*:)?featureMember\s*>/g;

  for await (const chunk of iterator) {
    text += decoder.decode(chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : chunk, {
      stream: true
    });
    let consumedTextLength = 0;
    let match: RegExpExecArray | null = featureMemberPattern.exec(text);
    while (match) {
      consumedTextLength = featureMemberPattern.lastIndex;
      const parsed = parseGML(match[0], options);
      if (parsed && parsed.type === 'FeatureCollection') features.push(...parsed.features);
      if (features.length >= batchSize) {
        yield {type: 'FeatureCollection', features: features.splice(0, batchSize)};
      }
      match = featureMemberPattern.exec(text);
    }
    if (consumedTextLength > 0) {
      text = text.slice(consumedTextLength);
      featureMemberPattern.lastIndex = 0;
    }
  }
  text += decoder.decode();
  const parsed = parseGML(text, options);
  if (parsed && parsed.type === 'FeatureCollection') features.push(...parsed.features);
  if (features.length) yield {type: 'FeatureCollection', features};
}
