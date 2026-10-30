// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  MarkdownBlock,
  MarkdownDocument,
  MarkdownInline,
  MarkdownLoaderOptions
} from '../../markdown-types';

/** Parses a small Markdown subset without rendering, evaluating, or fetching content. */
export function parseMarkdownSync(
  text: string,
  options: MarkdownLoaderOptions['markdown'] = {}
): MarkdownDocument {
  const maxDepth = options.maxDepth ?? 32;
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 1 || maxDepth > 128) {
    throw new Error('Markdown: maxDepth must be an integer between 1 and 128');
  }
  const lines = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n');
  return {type: 'root', children: parseBlocks(lines, 1, maxDepth)};
}

/** Checks the shared inline/quote nesting budget. */
function checkDepth(depth: number, maxDepth: number): void {
  if (depth > maxDepth) throw new Error('Markdown: maximum nesting depth exceeded');
}

/** Parses blocks while preserving code contents and source ordering. */
function parseBlocks(lines: string[], depth: number, maxDepth: number): MarkdownBlock[] {
  checkDepth(depth, maxDepth);
  const blocks: MarkdownBlock[] = [];
  const paragraph: string[] = [];
  /** Emits accumulated paragraph lines before another block begins. */
  function flushParagraph(): void {
    if (paragraph.length) {
      blocks.push({
        type: 'paragraph',
        children: parseInline(paragraph.join('\n'), depth, maxDepth)
      });
      paragraph.length = 0;
    }
  }
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      flushParagraph();
      index++;
      continue;
    }
    const fence = /^ {0,3}(`{3,}|~{3,})([^`]*)$/.exec(line);
    if (fence) {
      flushParagraph();
      const code: string[] = [];
      index++;
      while (index < lines.length) {
        const candidate = lines[index].trim();
        const closes = fence[1][0] === '`' ? /^`{3,}$/.test(candidate) : /^~{3,}$/.test(candidate);
        if (closes && candidate.length >= fence[1].length) break;
        code.push(lines[index++]);
      }
      const language = fence[2].trim();
      blocks.push({type: 'code', value: code.join('\n'), ...(language ? {language} : {})});
      if (index < lines.length) index++;
      continue;
    }
    const heading = /^ {0,3}(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        depth: heading[1].length,
        children: parseInline(heading[2].replace(/\s+#+$/, ''), depth, maxDepth)
      });
      index++;
      continue;
    }
    if (
      /^ {0,3}(?:\*\s*){3,}$/.test(line) ||
      /^ {0,3}(?:-\s*){3,}$/.test(line) ||
      /^ {0,3}(?:_\s*){3,}$/.test(line)
    ) {
      flushParagraph();
      blocks.push({type: 'thematicBreak'});
      index++;
      continue;
    }
    if (/^ {0,3}>/.test(line)) {
      flushParagraph();
      const quote: string[] = [];
      while (index < lines.length && /^ {0,3}>/.test(lines[index])) {
        quote.push(lines[index++].replace(/^ {0,3}> ?/, ''));
      }
      blocks.push({type: 'blockquote', children: parseBlocks(quote, depth + 1, maxDepth)});
      continue;
    }
    const item = /^ {0,3}([-+*]|\d+[.)])\s+(.*)$/.exec(line);
    if (item) {
      flushParagraph();
      const ordered = /^\d/.test(item[1]);
      const items: MarkdownInline[][] = [];
      while (index < lines.length) {
        const next = /^ {0,3}([-+*]|\d+[.)])\s+(.*)$/.exec(lines[index]);
        if (!next || /^\d/.test(next[1]) !== ordered) break;
        items.push(parseInline(next[2], depth, maxDepth));
        index++;
      }
      const start = Number.parseInt(item[1], 10);
      if (ordered && !Number.isSafeInteger(start))
        throw new Error('Markdown: invalid ordered-list start');
      blocks.push({type: 'list', ordered, ...(ordered ? {start} : {}), items});
      continue;
    }
    paragraph.push(line);
    index++;
  }
  flushParagraph();
  return blocks;
}

/** Parses inline markup, leaving raw HTML and authored destinations as inert data. */
function parseInline(text: string, depth: number, maxDepth: number): MarkdownInline[] {
  checkDepth(depth, maxDepth);
  const nodes: MarkdownInline[] = [];
  const missing = new Set<string>();
  let index = 0;
  /** Coalesces literal text rather than returning one node per character. */
  function appendText(value: string): void {
    const previous = nodes[nodes.length - 1];
    if (previous?.type === 'text') previous.value += value;
    else nodes.push({type: 'text', value});
  }
  /** Finds a closing delimiter once; absent suffixes are memoized to avoid quadratic rescans. */
  function findClosing(delimiter: string, start: number): number {
    if (missing.has(delimiter)) return -1;
    const found = text.indexOf(delimiter, start);
    if (found < 0) missing.add(delimiter);
    return found;
  }
  while (index < text.length) {
    if (
      text[index] === '\\' &&
      /[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~]/.test(text[index + 1] || '')
    ) {
      appendText(text[index + 1]);
      index += 2;
      continue;
    }
    if (text[index] === '`') {
      const marker = /^`+/.exec(text.slice(index))![0];
      const end = findClosing(marker, index + marker.length);
      if (end >= 0) {
        nodes.push({type: 'code', value: text.slice(index + marker.length, end)});
        index = end + marker.length;
        continue;
      }
      appendText(marker);
      index += marker.length;
      continue;
    }
    const image = text.startsWith('![', index);
    if (image || text[index] === '[') {
      const labelStart = index + (image ? 2 : 1);
      const labelEnd = findClosing('](', labelStart);
      const end = labelEnd >= 0 ? findClosing(')', labelEnd + 2) : -1;
      if (end >= 0) {
        const label = text.slice(labelStart, labelEnd);
        const url = text.slice(labelEnd + 2, end);
        nodes.push(
          image
            ? {type: 'image', alt: label, url}
            : {type: 'link', url, children: parseInline(label, depth + 1, maxDepth)}
        );
        index = end + 1;
        continue;
      }
    }
    const marker =
      text.startsWith('**', index) || text.startsWith('__', index)
        ? text.slice(index, index + 2)
        : '*_'.includes(text[index])
          ? text[index]
          : '';
    if (marker) {
      const end = findClosing(marker, index + marker.length);
      if (end > index + marker.length) {
        nodes.push({
          type: marker.length === 2 ? 'strong' : 'emphasis',
          children: parseInline(text.slice(index + marker.length, end), depth + 1, maxDepth)
        });
        index = end + marker.length;
        continue;
      }
    }
    appendText(text[index++]);
  }
  return nodes;
}
