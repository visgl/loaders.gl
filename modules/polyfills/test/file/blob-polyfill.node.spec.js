import {expect, test} from 'vitest';
test('test basic', async () => {
  expect(typeof Blob).toBe('function');
});
test('test jsdom', async () => {
  const blob = new Blob(['TEST']);
  expect(blob.size, 'Initial blob should have a size of 4').toBe(4);
});
test('should encode a blob with proper size when given two strings as arguments', async () => {
  const blob = new Blob(['hi', 'hello']);
  expect(blob.size).toBe(7);
});
test('should encode arraybuffers with right content', async () => {
    const bytes = new Uint8Array(5);
    for (let i = 0; i < 5; i++) bytes[i] = i;
    const blob = new Blob([bytes.buffer]);
    const buffer = await blob.arrayBuffer();
    const result = new Uint8Array(buffer);
    for (let i = 0; i < 5; i++) {
      expect(result[i]).toBe(i);
    }
});
test('should encode typed arrays with right content', async () => {
    const bytes = new Uint8Array(5);
    for (let i = 0; i < 5; i++) bytes[i] = i;
    const blob = new Blob([bytes]);
    const buffer = await blob.arrayBuffer();
    const result = new Uint8Array(buffer);
    for (let i = 0; i < 5; i++) {
      expect(result[i]).toBe(i);
    }
});
test('should encode sliced typed arrays with right content', async () => {
    const bytes = new Uint8Array(5);
    for (let i = 0; i < 5; i++) bytes[i] = i;
    const blob = new Blob([bytes.subarray(2)]);
    const buffer = await blob.arrayBuffer();
    const result = new Uint8Array(buffer);
    for (let i = 0; i < 3; i++) {
      expect(result[i]).toBe(i + 2);
    }
});
test('should encode with blobs', async () => {
    const bytes = new Uint8Array(5);
    for (let i = 0; i < 5; i++) bytes[i] = i;
    const blob = new Blob([new Blob([bytes.buffer])]);
    const buffer = await blob.arrayBuffer();
    const result = new Uint8Array(buffer);
    for (let i = 0; i < 5; i++) {
      expect(result[i]).toBe(i);
    }
});
test('should enode mixed contents to right size', async () => {
    const bytes = new Uint8Array(5);
    for (let i = 0; i < 5; i++) {
      bytes[i] = i;
    }
    const blob = new Blob([bytes.buffer, 'hello']);
    expect(blob.size).toBe(10);
});
test('should accept mime type', async () => {
    const blob = new Blob(['hi', 'hello'], {type: 'text/html'});
    expect(blob.type).toBe('text/html');
});
test('should be an instance of constructor', async () => {
    const blob = new Blob(['hi']);
    expect(blob instanceof Blob).toBeTruthy();
});
test('from text', async () => {
    const blob = new Blob(['hello']);
    expect(blob.size, 'is right size').toBe(5);
    expect(blob.type, 'type is empty').toBe('');
    expect(await blob.text(), 'reads as text').toBe('hello');
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual([
      ...'hello'.split('').map(char => char.charCodeAt(0))
    ]);
});
test('from text with type', async () => {
    const blob = new Blob(['hello'], {type: 'text/markdown'});
    expect(blob.size, 'is right size').toBe(5);
    expect(blob.type, 'type is set').toBe('text/markdown');
    expect(await blob.text(), 'reads as text').toBe('hello');
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual([
      ...'hello'.split('').map(char => char.charCodeAt(0))
    ]);
});
test('empty blob', async () => {
    const blob = new Blob([]);
    expect(blob.size, 'size is 0').toBe(0);
    expect(blob.type, 'type is empty').toBe('');
    expect(await blob.text(), 'reads as text').toBe('');
    expect(await blob.arrayBuffer(), 'returns empty buffer').toEqual(new ArrayBuffer(0));
});
test('no args', async () => {
    const blob = new Blob();
    expect(blob.size, 'size is 0').toBe(0);
    expect(blob.type, 'type is empty').toBe('');
    expect(await blob.text(), 'reads as text').toBe('');
    expect(await blob.arrayBuffer(), 'returns empty buffer').toEqual(new ArrayBuffer(0));
});
test('all emtpy args', async () => {
    const blob = new Blob(['', new Blob(), '', new Uint8Array(0), new ArrayBuffer(0)]);
    expect(blob.size, 'size is 0').toBe(0);
    expect(blob.type, 'type is empty').toBe('');
    expect(await blob.text(), 'reads as text').toBe('');
    expect(await blob.arrayBuffer(), 'returns empty buffer').toEqual(new ArrayBuffer(0));
});
test('combined blob', async () => {
    const uint8 = new Uint8Array([1, 2, 3]);
    const uint16 = new Uint16Array([8, 190]);
    const float32 = new Float32Array([5.4, 9, 1.5]);
    const string = 'hello world';
    const blob = new Blob([uint8, uint16, float32, string]);
    const b8 = blob.slice(0, uint8.byteLength);
    const r8 = new Uint8Array(await b8.arrayBuffer());
    expect(uint8).toEqual(r8);
    const b16 = blob.slice(uint8.byteLength, uint8.byteLength + uint16.byteLength);
    const r16 = new Uint16Array(await b16.arrayBuffer());
    expect(uint16).toEqual(r16);
    const b32 = blob.slice(
      uint8.byteLength + uint16.byteLength,
      uint8.byteLength + uint16.byteLength + float32.byteLength
    );
    const r32 = new Float32Array(await b32.arrayBuffer());
    expect(float32).toEqual(r32);
    const bs = blob.slice(uint8.byteLength + uint16.byteLength + float32.byteLength);
    expect(string).toBe(await bs.text());
    expect('wo').toBe(await bs.slice(6, 8).text());
    expect('world').toBe(await bs.slice(6).text());
    expect('world').toBe(await blob.slice(-5).text());
});
test('emoji', async () => {
    const emojis = `👍🤷🎉😤`;
    const blob = new Blob([emojis]);
    const nestle = new Blob([new Blob([blob, blob])]);
    expect(emojis + emojis).toBe(await nestle.text());
});
