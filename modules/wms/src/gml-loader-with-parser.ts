// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {GMLFeatureCollection, Geometry, GMLPropertyType} from './lib/parsers/gml/parse-gml';
import {parseGML} from './lib/parsers/gml/parse-gml';
import {GMLLoader as GMLLoaderMetadata} from './gml-loader';

const {preload: _GMLLoaderPreload, ...GMLLoaderMetadataWithoutPreload} = GMLLoaderMetadata;

export type GMLLoaderOptions = LoaderOptions & {
  gml?: {
    /** Number of feature members emitted in each streaming batch. */
    batchSize?: number;
    /** XML Schema scalar types keyed by the local feature property name. */
    propertyTypes?: Record<string, GMLPropertyType>;
  };
};

/**
 * Loader for the response to the GML GetCapability request
 */
export const GMLLoaderWithParser = {
  ...GMLLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: GMLLoaderOptions) =>
    parseGML(new TextDecoder().decode(arrayBuffer), options?.gml || options),
  parseTextSync: (text: string, options?: GMLLoaderOptions) =>
    parseGML(text, options?.gml || options),
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
  const parser = new GMLFeatureStreamParser();
  let features: GMLFeatureCollection['features'] = [];
  const batchSize = options?.gml?.batchSize || 1000;

  for await (const chunk of iterator) {
    const fragments = parser.push(
      decoder.decode(chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : chunk, {
        stream: true
      })
    );
    for (const fragment of fragments) {
      const parsed = parseGMLFeatureFragment(fragment, options?.gml || options);
      if (parsed && parsed.type === 'FeatureCollection') features.push(...parsed.features);
      if (features.length >= batchSize) {
        yield {type: 'FeatureCollection', features: features.splice(0, batchSize)};
      }
    }
  }
  for (const fragment of parser.finish(decoder.decode())) {
    const parsed = parseGMLFeatureFragment(fragment, options?.gml || options);
    if (parsed && parsed.type === 'FeatureCollection') features.push(...parsed.features);
  }
  if (features.length) yield {type: 'FeatureCollection', features};
}

function parseGMLFeatureFragment(
  fragment: string,
  options?: GMLLoaderOptions['gml'] | GMLLoaderOptions
): Geometry | GMLFeatureCollection | null {
  return fragment.match(/<[^/!?][^>]*featureMember\b/i)
    ? parseGML(fragment, options)
    : parseGML(`<gml:featureMember>${fragment}</gml:featureMember>`, options);
}

class GMLFeatureStreamParser {
  private _text = '';
  private _insideFeatureMembers = false;
  private _featureMemberStart = -1;
  private _featureMemberDepth = 0;
  private _featureStart = -1;
  private _featureDepth = 0;

  push(text: string): string[] {
    this._text += text;
    return this._scan(false);
  }

  finish(text: string): string[] {
    this._text += text;
    return this._scan(true);
  }

  private _scan(isFinal: boolean): string[] {
    const fragments: string[] = [];
    const tokenPattern =
      /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/?\s*([A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?)\b[^>]*?>/g;
    let consumedTextLength = 0;
    let match: RegExpExecArray | null = tokenPattern.exec(this._text);
    while (match) {
      const token = match[0];
      if (token.startsWith('<!--') || token.startsWith('<?')) {
        match = tokenPattern.exec(this._text);
        continue;
      }
      const localName = match[1].split(':').pop()!;
      const isClosing = token.startsWith('</');
      const isSelfClosing = /\/\s*>$/.test(token);

      if (!isClosing && localName === 'featureMember') {
        this._featureMemberStart = match.index;
        this._featureMemberDepth = isSelfClosing ? 0 : 1;
        if (isSelfClosing) {
          fragments.push(this._text.slice(this._featureMemberStart, tokenPattern.lastIndex));
          consumedTextLength = tokenPattern.lastIndex;
          this._featureMemberStart = -1;
        }
        match = tokenPattern.exec(this._text);
        continue;
      }
      if (this._featureMemberDepth > 0) {
        if (!isClosing && !isSelfClosing) this._featureMemberDepth++;
        if (isClosing) this._featureMemberDepth--;
        if (this._featureMemberDepth === 0) {
          fragments.push(this._text.slice(this._featureMemberStart, tokenPattern.lastIndex));
          consumedTextLength = tokenPattern.lastIndex;
          this._featureMemberStart = -1;
        }
        match = tokenPattern.exec(this._text);
        continue;
      }

      if (!isClosing && localName === 'featureMembers') {
        this._insideFeatureMembers = true;
        match = tokenPattern.exec(this._text);
        continue;
      }
      if (
        this._insideFeatureMembers &&
        this._featureDepth === 0 &&
        !isClosing &&
        localName !== 'featureMembers'
      ) {
        this._featureStart = match.index;
        this._featureDepth = isSelfClosing ? 0 : 1;
        if (isSelfClosing) {
          fragments.push(this._text.slice(this._featureStart, tokenPattern.lastIndex));
          consumedTextLength = tokenPattern.lastIndex;
          this._featureStart = -1;
        }
        match = tokenPattern.exec(this._text);
        continue;
      }
      if (this._featureDepth > 0) {
        if (!isClosing && !isSelfClosing) this._featureDepth++;
        if (isClosing) this._featureDepth--;
        if (this._featureDepth === 0) {
          fragments.push(this._text.slice(this._featureStart, tokenPattern.lastIndex));
          consumedTextLength = tokenPattern.lastIndex;
          this._featureStart = -1;
        }
      }
      if (isClosing && localName === 'featureMembers') this._insideFeatureMembers = false;
      match = tokenPattern.exec(this._text);
    }

    if (consumedTextLength > 0) {
      this._text = this._text.slice(consumedTextLength);
    } else if (isFinal && this._text.trim()) {
      this._text = '';
    }
    return fragments;
  }
}
