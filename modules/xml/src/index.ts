// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// XMLLoader

export type {XMLLoaderOptions} from './xml-loader';
export {XMLLoader} from './xml-loader';

// HTMLLoader

export type {HTMLLoaderOptions} from './html-loader';
export {HTMLLoader} from './html-loader';

// SAX

export type {SAXParserOptions as SAXParserOptions} from './sax-ts/sax';
export {SAXParser as SAXParser} from './sax-ts/sax';

// Utilities

export {convertXMLValueToArray, convertXMLFieldToArrayInPlace} from './lib/xml-utils/xml-utils';

// Experimental

export {
  uncapitalize as _uncapitalize,
  uncapitalizeKeys as _uncapitalizeKeys
} from './lib/xml-utils/uncapitalize';
