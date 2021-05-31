// Forked from @Gozala's https://github.com/Gozala/web-blob under MIT license
import test from 'tape-promise/tape';

test('test basic', async t => {
  t.isEqual(typeof Blob, 'function');
});

test('test jsdom', async t => {
  const blob = new Blob(['TEST']);
  t.isEqual(blob.size, 4, 'Initial blob should have a size of 4');
});

test('should encode a blob with proper size when given two strings as arguments', async t => {
  const blob = new Blob(['hi', 'hello']);
  t.isEqual(blob.size, 7);
});

test('should encode arraybuffers with right content', async t => {
  const bytes = new Uint8Array(5);
  for (let i = 0; i < 5; i++) bytes[i] = i;
  const blob = new Blob([bytes.buffer]);
  const buffer = await blob.arrayBuffer();
  const result = new Uint8Array(buffer);
  for (let i = 0; i < 5; i++) {
    t.isEqual(result[i], i);
  }
});

test('should encode typed arrays with right content', async t => {
  const bytes = new Uint8Array(5);
  for (let i = 0; i < 5; i++) bytes[i] = i;
  const blob = new Blob([bytes]);

  const buffer = await blob.arrayBuffer();
  const result = new Uint8Array(buffer);

  for (let i = 0; i < 5; i++) {
    t.isEqual(result[i], i);
  }
});

test('should encode sliced typed arrays with right content', async t => {
  const bytes = new Uint8Array(5);
  for (let i = 0; i < 5; i++) bytes[i] = i;
  const blob = new Blob([bytes.subarray(2)]);

  const buffer = await blob.arrayBuffer();
  const result = new Uint8Array(buffer);
  for (let i = 0; i < 3; i++) {
    t.isEqual(result[i], i + 2);
  }
});

test('should encode with blobs', async t => {
  const bytes = new Uint8Array(5);
  for (let i = 0; i < 5; i++) bytes[i] = i;
  const blob = new Blob([new Blob([bytes.buffer])]);
  const buffer = await blob.arrayBuffer();
  const result = new Uint8Array(buffer);
  for (let i = 0; i < 5; i++) {
    t.isEqual(result[i], i);
  }
});

test('should enode mixed contents to right size', async t => {
  const bytes = new Uint8Array(5);
  for (let i = 0; i < 5; i++) {
    bytes[i] = i;
  }
  const blob = new Blob([bytes.buffer, 'hello']);
  t.isEqual(blob.size, 10);
});

test('should accept mime type', async t => {
  const blob = new Blob(['hi', 'hello'], {type: 'text/html'});
  t.isEqual(blob.type, 'text/html');
});

test('should be an instance of constructor', async t => {
  const blob = new Blob(['hi']);
  t.ok(blob instanceof Blob);
});

test('from text', async t => {
  const blob = new Blob(['hello']);
  t.isEqual(blob.size, 5, 'is right size');
  t.isEqual(blob.type, '', 'type is empty');
  t.isEqual(await blob.text(), 'hello', 'reads as text');
  t.isEquivalent(new Uint8Array(await blob.arrayBuffer()), [
    ...'hello'.split('').map(char => char.charCodeAt(0))
  ]);
});

test('from text with type', async t => {
  const blob = new Blob(['hello'], {type: 'text/markdown'});
  t.isEqual(blob.size, 5, 'is right size');
  t.isEqual(blob.type, 'text/markdown', 'type is set');
  t.isEqual(await blob.text(), 'hello', 'reads as text');
  t.isEquivalent(new Uint8Array(await blob.arrayBuffer()), [
    ...'hello'.split('').map(char => char.charCodeAt(0))
  ]);
});

test('empty blob', async t => {
  const blob = new Blob([]);
  t.isEqual(blob.size, 0, 'size is 0');
  t.isEqual(blob.type, '', 'type is empty');
  t.isEqual(await blob.text(), '', 'reads as text');
  t.isEquivalent(await blob.arrayBuffer(), new ArrayBuffer(0), 'returns empty buffer');
});

test('no args', async t => {
  const blob = new Blob();
  t.isEqual(blob.size, 0, 'size is 0');
  t.isEqual(blob.type, '', 'type is empty');
  t.isEqual(await blob.text(), '', 'reads as text');
  t.isEquivalent(await blob.arrayBuffer(), new ArrayBuffer(0), 'returns empty buffer');
});

test('all emtpy args', async t => {
  const blob = new Blob(['', new Blob(), '', new Uint8Array(0), new ArrayBuffer(0)]);
  t.isEqual(blob.size, 0, 'size is 0');
  t.isEqual(blob.type, '', 'type is empty');
  t.isEqual(await blob.text(), '', 'reads as text');
  t.isEquivalent(await blob.arrayBuffer(), new ArrayBuffer(0), 'returns empty buffer');
});

test('combined blob', async t => {
  const uint8 = new Uint8Array([1, 2, 3]);
  const uint16 = new Uint16Array([8, 190]);
  const float32 = new Float32Array([5.4, 9, 1.5]);
  const string = 'hello world';
  const blob = new Blob([uint8, uint16, float32, string]);

  const b8 = blob.slice(0, uint8.byteLength);
  const r8 = new Uint8Array(await b8.arrayBuffer());
  t.isEquivalent(uint8, r8);

  const b16 = blob.slice(uint8.byteLength, uint8.byteLength + uint16.byteLength);
  const r16 = new Uint16Array(await b16.arrayBuffer());
  t.isEquivalent(uint16, r16);

  const b32 = blob.slice(
    uint8.byteLength + uint16.byteLength,
    uint8.byteLength + uint16.byteLength + float32.byteLength
  );
  const r32 = new Float32Array(await b32.arrayBuffer());
  t.isEquivalent(float32, r32);

  const bs = blob.slice(uint8.byteLength + uint16.byteLength + float32.byteLength);
  t.isEqual(string, await bs.text());

  t.isEqual('wo', await bs.slice(6, 8).text());
  t.isEqual('world', await bs.slice(6).text());
  t.isEqual('world', await blob.slice(-5).text());
});

test('emoji', async t => {
  const emojis = `👍🤷🎉😤`;
  const blob = new Blob([emojis]);
  const nestle = new Blob([new Blob([blob, blob])]);
  t.isEqual(emojis + emojis, await nestle.text());
});

/*
test('streams', async t => {
  const blob = new Blob(['hello', ' ', 'world'], {type: 'text/plain'});
  const stream = blob.stream();

  const reader = stream.getReader();
  const chunks = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const {done, value} = await reader.read();
    if (done) {
      break;
    }

    if (value !== null) {
      chunks.push(Buffer.from(value));
    }
  }

  t.deepEqual('hello world', Buffer.concat(chunks).toString());
});
*/
