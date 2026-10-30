// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/core/loader-utils';

/** Inline nodes in the supported Markdown subset; URLs and text are data, not HTML. */
export type MarkdownInline =
  | {
      /** Node kind. */
      type: 'text' | 'code';
      /** Literal text. */
      value: string;
    }
  | {
      /** Node kind. */
      type: 'emphasis' | 'strong';
      /** Nested inline content. */
      children: MarkdownInline[];
    }
  | {
      /** Node kind. */
      type: 'link';
      /** Authored destination, without URL execution or validation. */
      url: string;
      /** Link label. */
      children: MarkdownInline[];
    }
  | {
      /** Node kind. */
      type: 'image';
      /** Authored image destination. */
      url: string;
      /** Plain alternative text. */
      alt: string;
    };

/** Block nodes in the supported Markdown subset. */
export type MarkdownBlock =
  | {
      /** Node kind. */
      type: 'heading';
      /** Heading level, 1–6. */
      depth: number;
      /** Inline heading content. */
      children: MarkdownInline[];
    }
  | {
      /** Node kind. */
      type: 'paragraph';
      /** Inline paragraph content; soft line breaks remain text. */
      children: MarkdownInline[];
    }
  | {
      /** Node kind. */
      type: 'code';
      /** Literal fenced code, without evaluation. */
      value: string;
      /** Optional fence information string. */
      language?: string;
    }
  | {
      /** Node kind. */
      type: 'list';
      /** Whether list markers are numeric. */
      ordered: boolean;
      /** First numeric marker, for ordered lists. */
      start?: number;
      /** Single-line list items. */
      items: MarkdownInline[][];
    }
  | {
      /** Node kind. */
      type: 'blockquote';
      /** Nested quote blocks. */
      children: MarkdownBlock[];
    }
  | {
      /** Node kind. */
      type: 'thematicBreak';
    };

/** Parsed Markdown document. This deliberately does not claim CommonMark or mdast conformance. */
export type MarkdownDocument = {
  /** Root node discriminator. */
  type: 'root';

  /** Document blocks in source order. */
  children: MarkdownBlock[];
};

/** Options for parsing a bounded, simple Markdown subset. */
export type MarkdownLoaderOptions = LoaderOptions & {
  /** Markdown parser options. */
  markdown?: {
    /** Maximum inline or quote nesting, including the root; integer 1–128. Defaults to 32. */
    maxDepth?: number;
  };
};
