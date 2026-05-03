// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Physical serialization used by a format.
 */
export type FormatEncoding =
  | 'text'
  | 'json'
  | 'xml'
  | 'csv'
  | 'binary'
  | 'protobuf'
  | 'flatbuffers'
  | 'arrow'
  | 'parquet'
  | 'sqlite'
  | 'zip'
  | 'image'
  | 'video';

/**
 * An object that describes a format
 */
export type Format = {
  /** Human readable name */
  name: string;
  /** Unique lower-case id string for this format. Used for e.g. LoaderOptions */
  id: string;
  /** loaders.gl module that contains the implementation of this format */
  module: string;
  /** Which category does this loader belong to */
  category?: string;
  /** Physical serialization used by this format. */
  encoding?: FormatEncoding;
  /** Logical format represented by this loader or writer. */
  format?: string;
  /** File extensions that are potential matches with this loader. */
  extensions: string[];
  /** MIMETypes that indicate a match with this loader. @note Some MIMETypes are generic and supported by many loaders */
  mimeTypes: string[];
  /** Is this a binary format */
  binary?: boolean;
  /** Is this a text format */
  text?: boolean;
  /** Test some initial bytes of content to see if this loader might be a match */
  tests?: (((ArrayBuffer: ArrayBuffer) => boolean) | ArrayBuffer | string)[];
};
