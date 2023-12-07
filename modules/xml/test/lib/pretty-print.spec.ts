// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Inspired by a sax-js example under ISC license

import test from 'tape-promise/tape';
import {SAXParser} from '@loaders.gl/xml';
import {fetchFile} from '@loaders.gl/core';

const FORECASTS_URL = '@loaders.gl/xml/test/data/forecasts.xml';

test('XML#pretty-print', async (t) => {
  t.test('forecasts.xml', async (t) => {
    const response = await fetchFile(FORECASTS_URL);
    const json = await response.text();

    const prettyPrinter = new PrettyPrinter();
    prettyPrinter.onprintline = (line) => {};
    // prettyPrinter.onprintline = line => t.comment(line);
    prettyPrinter.write(json);

    t.end();
  });

  t.end();
});

class PrettyPrinter {
  readonly parser: SAXParser;
  // eslint-disable-next-line no-console
  onprintline = (line: string): void => console.log(line);
  private tabstop = 2;
  private level = 0;
  private currentLine = '';

  constructor() {
    this.parser = this._createParser();
  }

  write(xml: string) {
    this.parser.write(xml);
  }

  private print(string: string) {
    this.currentLine += string;
  }

  private println() {
    this.onprintline(this.currentLine);
    this.currentLine = '';
  }

  private indent() {
    this.println();
    for (let i = this.level * this.tabstop; i > 0; i--) {
      this.print('.');
    }
  }

  private _createParser() {
    return new SAXParser({
      onopentag: (tag) => {
        this.indent();
        this.level++;
        this.print(`<${tag.name}`);
        for (const i in tag.attributes) {
          this.print(` ${i}="${entity(tag.attributes[i])}"`);
        }
        this.print('>');
      },

      ontext: (text) => {
        this.indent();
        this.print(text);
      },

      ondoctype: (text) => {
        this.indent();
        this.print(text);
      },

      onclosetag: (tag) => {
        this.level--;
        this.indent();
        this.print(`</${tag}>`);
      },

      oncdata: (data) => {
        this.indent();
        this.print(`<![CDATA[${data}]]>`);
      },

      oncomment: (comment) => {
        this.indent();
        this.print(`<!--${comment}-->`);
      },

      onerror: (error) => {
        console.error(error); // eslint-disable-line no-console
        throw error;
      }
    });
  }
}

function entity(str) {
  return str.replace('"', '&quot;');
}
