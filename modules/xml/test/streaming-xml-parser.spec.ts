import {describe, expect, test} from 'vitest';
import {StreamingXMLParser} from '../src/lib/parsers/streaming-xml-parser';

describe('StreamingXMLParser', () => {
  test('builds nested objects from chunked XML', () => {
    const parser = new StreamingXMLParser({});
    parser.write('<root><name>Ada</name></root>');
    parser.close();

    expect(parser.result).toEqual({ROOT: {NAME: 'Ada'}});
  });

  test('supports explicit array events and reset', () => {
    const parser = new StreamingXMLParser({});
    parser.parser.emit('onopenarray');
    parser.parser.emit('ontext', 'first');
    parser.parser.emit('ontext', 'second');
    parser.parser.emit('onclosearray');
    parser.parser.emit('onend');
    expect(parser.result).toEqual(['first', 'second']);

    parser.reset();
    expect(parser.result).toBeUndefined();
    expect(parser.previousStates).toEqual([]);
  });

  test('forwards parser errors', () => {
    const parser = new StreamingXMLParser({});
    expect(() => parser.parser.emit('onerror', new Error('bad xml'))).toThrow('bad xml');
  });
});
