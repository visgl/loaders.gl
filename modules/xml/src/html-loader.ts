// loaders.gl, MIT license

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {mergeLoaderOptions} from '@loaders.gl/loader-utils';
import {XMLLoader, XMLLoaderOptions} from './xml-loader';

export type HTMLLoaderOptions = XMLLoaderOptions;

/**
 * Loader for HTML files
 * Essentially a copy of the XMLLoader with different mime types, file extensions and content tests.
 * This split enables applications can control whether they want HTML responses to be parsed by the XML loader or not.
 * This loader does not have any additional understanding of the structure of HTML or the document.
 */
export const HTMLLoader: LoaderWithParser = {
  ...XMLLoader,
  name: 'HTML',
  id: 'html',
  extensions: ['html', 'htm'],
  mimeTypes: ['text/html'],
  testText: testHTMLFile,
  parse: async (arrayBuffer: ArrayBuffer, options?: XMLLoaderOptions) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: XMLLoaderOptions) => parseTextSync(text, options)
};

function testHTMLFile(text: string): boolean {
  // TODO - There could be space first.
  return text.startsWith('<html');
}

function parseTextSync(text: string, options?: XMLLoaderOptions): any {
  // fast-xml-parser can recognize HTML entities
  // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md#htmlentities
  // https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/5.Entities.md
  options = mergeLoaderOptions(options, {
    xml: {
      parser: 'fast-xml-parser'
    },
    _fastXML: {
      htmlEntities: true
    }
  });

  return XMLLoader.parseTextSync(text, options);
}
