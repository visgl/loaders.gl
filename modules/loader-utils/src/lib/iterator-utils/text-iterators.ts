// TextDecoder iterators
// TextDecoder will keep any partial undecoded bytes between calls to `decode`

export async function* makeTextDecoderIterator(
  arrayBufferIterator: AsyncIterable<ArrayBuffer>,
  options: object = {}
): AsyncIterable<string> {
  const textDecoder = new TextDecoder(undefined, options);
  for await (const arrayBuffer of arrayBufferIterator) {
    yield typeof arrayBuffer === 'string'
      ? arrayBuffer
      : textDecoder.decode(arrayBuffer, {stream: true});
  }
}

// TextEncoder iterator
// TODO - this is not useful unless min chunk size is given
// TextEncoder will keep any partial undecoded bytes between calls to `encode`
// If iterator does not yield strings, assume arrayBuffer and return unencoded

export async function* makeTextEncoderIterator(
  textIterator: AsyncIterable<string>,
  options?: object
): AsyncIterable<ArrayBuffer> {
  const textEncoder = new TextEncoder();
  for await (const text of textIterator) {
    yield typeof text === 'string' ? textEncoder.encode(text) : text;
  }
}

/**
 * @param textIterator async iterable yielding strings
 * @returns an async iterable over lines
 * See http://2ality.com/2018/04/async-iter-nodejs.html
 */

export async function* makeLineIterator(
  textIterator: AsyncIterable<string>
): AsyncIterable<string> {
  let previous = '';
  for await (const textChunk of textIterator) {
    previous += textChunk;
    let eolIndex;
    while ((eolIndex = previous.indexOf('\n')) >= 0) {
      // line includes the EOL
      const line = previous.slice(0, eolIndex + 1);
      previous = previous.slice(eolIndex + 1);
      yield line;
    }
  }

  if (previous.length > 0) {
    yield previous;
  }
}

/**
 * @param lineIterator async iterable yielding lines
 * @returns async iterable yielding numbered lines
 *
 * See http://2ality.com/2018/04/async-iter-nodejs.html
 */
export async function* makeNumberedLineIterator(
  lineIterator: AsyncIterable<string>
): AsyncIterable<{counter: number; line: string}> {
  let counter = 1;
  for await (const line of lineIterator) {
    yield {counter, line};
    counter++;
  }
}
