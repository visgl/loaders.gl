import {expect, test, vi} from 'vitest';
import {readCatalogTextStream} from '../website/src/components/docs/catalog-text-stream';
import {getCatalogEditorSchema} from '../website/src/components/docs/catalog-editor-schemas';

const TEXT_BYTE_LIMIT = 256 * 1024;

/** Creates a finite byte stream without public-network access. */
function createByteStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    }
  });
}

test.each([-1, 0, 1])('distinguishes EOF at the text limit, offset %i', async offset => {
  const bytes = new Uint8Array(TEXT_BYTE_LIMIT + offset).fill(120);
  const stream = createByteStream([bytes]);
  const preview = await readCatalogTextStream(stream);
  expect(preview.truncated).toBe(offset > 0);
  expect(preview.text).toHaveLength(Math.min(bytes.length, TEXT_BYTE_LIMIT));
  expect(stream.locked).toBe(false);
});

test('complete JSON exactly at the limit remains eligible for schema validation', async () => {
  const document = {
    type: 'Catalog',
    stac_version: '1.1.0',
    id: 'boundary',
    description: 'Boundary',
    links: []
  };
  const json = JSON.stringify(document);
  const bytes = new TextEncoder().encode(json + ' '.repeat(TEXT_BYTE_LIMIT - json.length));
  const preview = await readCatalogTextStream(createByteStream([bytes]));
  expect(preview.truncated).toBe(false);
  const parsedDocument = JSON.parse(preview.text);
  expect(parsedDocument).toEqual(document);
  expect(getCatalogEditorSchema(parsedDocument, 'https://example.test/catalog.json')).toBeDefined();
});

test('decodes UTF-8 characters split across chunks', async () => {
  const bytes = new TextEncoder().encode('漢字');
  const preview = await readCatalogTextStream(
    createByteStream([bytes.subarray(0, 1), bytes.subarray(1, 4), bytes.subarray(4)])
  );
  expect(preview).toEqual({text: '漢字', truncated: false});
});

test('peeks past an exact limit and cancels without reading the remaining body', async () => {
  const chunks = [
    new Uint8Array(TEXT_BYTE_LIMIT).fill(120),
    new Uint8Array(),
    new Uint8Array([121]),
    new Uint8Array(100)
  ];
  let pullCount = 0;
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        if (pullCount < chunks.length) controller.enqueue(chunks[pullCount++]);
        else controller.close();
      },
      cancel
    },
    {highWaterMark: 0}
  );
  const preview = await readCatalogTextStream(stream);
  expect(preview.truncated).toBe(true);
  expect(preview.text).toHaveLength(TEXT_BYTE_LIMIT);
  expect(pullCount).toBe(3);
  expect(cancel).toHaveBeenCalledOnce();
  expect(stream.locked).toBe(false);
});

test('releases the reader when the source stream fails', async () => {
  const failure = new Error('read failed');
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.error(failure);
    }
  });
  await expect(readCatalogTextStream(stream)).rejects.toBe(failure);
  expect(stream.locked).toBe(false);
});
