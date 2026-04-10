// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Small Arrow Sample Files
export const ARROW_SIMPLE = '@loaders.gl/arrow/test/data/arrow/simple.arrow';
export const ARROW_DICTIONARY = '@loaders.gl/arrow/test/data/arrow/dictionary.arrow';
export const ARROW_STRUCT = '@loaders.gl/arrow/test/data/arrow/struct.arrow';

// Bigger, batched sample file
export const ARROW_BIOGRID_NODES = '@loaders.gl/arrow/test/data/arrow/biogrid-nodes.arrow';

export const ARROW_TEST_CASES = [
  {
    title: 'simple.arrow',
    filename: ARROW_SIMPLE
  },
  // {
  //   title: 'dictionary.arrow',
  //   filename: ARROW_DICTIONARY
  // },
  {
    title: 'struct.arrow',
    filename: ARROW_STRUCT
  },
  {
    title: 'biogrid-nodes.arrow',
    filename: ARROW_BIOGRID_NODES
  }
] as const;
