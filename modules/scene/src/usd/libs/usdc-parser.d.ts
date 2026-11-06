// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Typed boundary around the pinned, dependency-free THREE r187 crate decoder. */
export class USDCParser {
  /** Decodes binary crate specifications; unsupported value encodings throw. */
  parseData(buffer: ArrayBuffer): {
    /** Specifications keyed by absolute Sdf path. */
    specsByPath: Record<
      string,
      {
        /** SdfSpecType numeric identifier. */
        specType: number;
        /** Authored field values before USDStage conversion. */
        fields: Record<string, unknown>;
      }
    >;
  };
}
