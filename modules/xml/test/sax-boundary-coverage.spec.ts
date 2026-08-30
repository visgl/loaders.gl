// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {SAXParser, type SAXParserOptions} from '../src/sax-ts/sax';

test('SAXParser covers declarations, processing instructions, CDATA, and recovery states', () => {
  const documents = [
    '<?target body?><root/>',
    '<!quoted declaration><root/>',
    '<!DOCTYPE root SYSTEM "quoted[value]" [<!ENTITY example "[value]">]><root/>',
    '<root><!-- comment --><![CDATA[first ]x second ]]]y third]]><child a="one" b=\'four\'/></root >'
  ].map(xml => parseSAX(xml, {strict: true, trim: true, normalize: true}));
  const names = documents.flatMap(document => document.names);
  expect(names).toEqual(
    expect.arrayContaining([
      'processinginstruction',
      'sgmldeclaration',
      'doctype',
      'comment',
      'opencdata',
      'cdata',
      'closecdata',
      'attribute'
    ])
  );
  expect(documents.flatMap(document => document.errors)).toEqual([]);
});

test.each([
  ['doctype after root', '<root/><!DOCTYPE root>', 'Inappropriately located doctype'],
  ['opening slash', '<root/ x></root>', 'Forward-slash in opening tag'],
  ['invalid open tag', '<root><child ?/></root>', 'Invalid attribute name'],
  ['invalid attribute', '<root ?bad="x"/>', 'Invalid attribute name'],
  ['adjacent attributes', '<root a="1"b="2"/>', 'No whitespace between attributes'],
  ['invalid close name', '<root></?root>', 'Invalid tagname in closing tag'],
  ['invalid close suffix', '<root></root ? >', 'Invalid characters in closing tag'],
  ['empty close tag', '<root></></root>', 'Invalid tagname in closing tag'],
  ['invalid entity', '<root>&bad name;</root>', 'Invalid character in entity name'],
  ['outside text', 'before<root/>after', 'Non-whitespace before first tag']
])('SAXParser recovers from %s', (_name, xml, expectedError) => {
  const {errors} = parseSAX(xml, {strict: true});
  expect(
    errors.some(error => error.includes(expectedError)),
    errors.join('\n')
  ).toBe(true);
});

test('SAXParser covers loose scripts, entities, namespaces, and bounded buffers', () => {
  const namespaceEvents = parseSAX(
    `<ROOT xmlns="urn:default" xmlns:p="urn:p" p:value="one">
       <p:CHILD value=&#X41; other=&AMP;>${' text '.repeat(12)}</p:CHILD>
     </ROOT>`,
    {strict: true, xmlns: true, MAX_BUFFER_LENGTH: 10, trim: true}
  );
  expect(namespaceEvents.names).toEqual(
    expect.arrayContaining(['opennamespace', 'closenamespace', 'text'])
  );
  expect(namespaceEvents.names.filter(name => name === 'attribute')).toHaveLength(5);
});

test('SAXParser covers DTD quoting, script recovery, and attribute state transitions', () => {
  const documents = [
    '<!DOCTYPE root [ "quoted ] value" ]><root/>',
    '<root absent next="x"/>',
    '<root quoted="&amp;&#65;&#x42;" unquoted=&AMP;/>',
    '<root duplicate="first" duplicate="second"/>',
    '<html><script>if (1 < 0) value = "ok";</script></html>'
  ].map(xml => parseSAX(xml, {strict: false}));
  const names = documents.flatMap(document => document.names);
  expect(names).toEqual(
    expect.arrayContaining(['doctype', 'attribute', 'script', 'opentag', 'closetag'])
  );
  expect(documents.flatMap(document => document.errors)).toEqual([]);
});

test('SAXParser validates reserved and unbound namespace declarations', () => {
  const documents = [
    '<root xmlns:xml="wrong"/>',
    '<root xmlns:xmlns="wrong"/>',
    '<root p:value="x"/>',
    '<p:root/>'
  ].map(xml => parseSAX(xml, {strict: true, xmlns: true}));
  expect(documents.flatMap(document => document.errors)).toEqual(
    expect.arrayContaining([
      expect.stringContaining('xml: prefix must be bound'),
      expect.stringContaining('xmlns: prefix must be bound'),
      expect.stringContaining('Unbound namespace prefix')
    ])
  );
});

test('SAXParser flushes partial CDATA and script buffers and guards lifecycle misuse', () => {
  const cdata: string[] = [];
  const parser = new SAXParser({oncdata: value => cdata.push(String(value))});
  parser.write('<root><![CDATA[partial');
  parser.flush();
  expect(cdata).toEqual(['partial']);
  parser.write(' remainder]]></root>').close();

  const script: string[] = [];
  const scriptParser = new SAXParser({onscript: value => script.push(String(value))});
  scriptParser.write('<script>partial');
  scriptParser.flush();
  expect(script).toEqual(['partial']);
  scriptParser.write(' remainder</script>').close();

  const closed = new SAXParser();
  closed.write('<root/>').close();
  expect(() => closed.write('<again/>')).not.toThrow();

  const errored = new SAXParser({strict: true});
  errored.write('invalid');
  expect(() => errored.write('<root/>')).toThrow('Text data outside of root node');
  errored.resume();
});

/** Parses one document while retaining event and recoverable error diagnostics. */
function parseSAX(
  xml: string,
  options: SAXParserOptions = {}
): {
  names: string[];
  values: string[];
  errors: string[];
} {
  const names: string[] = [];
  const values: string[] = [];
  const errors: string[] = [];
  const record = (value: unknown, eventName: string) => {
    names.push(eventName);
    if (typeof value === 'string' || typeof value === 'number') values.push(String(value));
  };
  const parser = new SAXParser({
    ...options,
    ontext: record,
    onprocessinginstruction: record,
    onsgmldeclaration: record,
    ondoctype: record,
    oncomment: record,
    onattribute: record,
    onopentag: record,
    onclosetag: record,
    onopencdata: record,
    oncdata: record,
    onclosecdata: record,
    onscript: record,
    onopennamespace: record,
    onclosenamespace: record,
    onerror: (error, eventName, saxParser) => {
      names.push(eventName);
      errors.push((error as Error).message);
      saxParser.resume();
    }
  });
  parser.write(xml).close();
  return {names, values, errors};
}
